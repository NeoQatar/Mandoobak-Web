'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import {
  VendorChat,
  Message,
  subscribeToVendorChats,
  subscribeToMyVendorChats,
  subscribeToVendorMessages,
  sendVendorMessage,
  markVendorMessagesAsRead,
  markVendorUnreadAsRead,
  ensureVendorChat,
  ensureOrderChat,
} from '@/lib/chat';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Search, MessageSquare, ArrowLeft, ImagePlus, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { uploadFileClient } from '@/lib/storage-client';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    chat: 'Chat',
    chatWithSupport: 'Chat with Support',
    conversations: 'Conversations',
    typeMessage: 'Type a message...',
    send: 'Send',
    noConversations: 'No conversations yet',
    noMessages: 'No messages yet',
    selectConversation: 'Select a conversation to start chatting',
    searchConversations: 'Search by order or vendor...',
    support: 'Support',
    startChat: 'Start Chat',
    startChatDesc: 'No conversation with support yet.',
    errorSend: 'Failed to send message.',
    errorUpload: 'Failed to upload image.',
    order: 'Order',
    vendor: 'Vendor',
    customer: 'Customer',
  },
  ar: {
    chat: 'المحادثات',
    chatWithSupport: 'المحادثة مع الدعم',
    conversations: 'المحادثات',
    typeMessage: 'اكتب رسالة...',
    send: 'إرسال',
    noConversations: 'لا توجد محادثات بعد',
    noMessages: 'لا توجد رسائل بعد',
    selectConversation: 'اختر محادثة للبدء',
    searchConversations: 'بحث بالطلب أو البائع...',
    support: 'الدعم',
    startChat: 'بدء المحادثة',
    startChatDesc: 'لا توجد محادثة مع الدعم بعد.',
    errorSend: 'فشل إرسال الرسالة.',
    errorUpload: 'فشل رفع الصورة.',
    order: 'طلب',
    vendor: 'بائع',
    customer: 'عميل',
  },
};

function getChatDisplayName(
  chat: VendorChat,
  userNames: Map<string, string>,
  t: typeof translations['en']
): string {
  if (chat.orderId === 'support') {
    const vendorName = (chat.vendorId && userNames.get(chat.vendorId)) || chat.vendorName || chat.vendorId || '';
    return vendorName ? `${vendorName} - ${t.support}` : t.support;
  }
  const vendorName = (chat.vendorId && userNames.get(chat.vendorId)) || chat.vendorName || '';
  const customerName = (chat.customerId && userNames.get(chat.customerId)) || '';
  if (vendorName && customerName) return `${vendorName} & ${customerName}`;
  if (vendorName) return vendorName;
  if (customerName) return customerName;
  if (chat.orderId) return `${t.order} #${chat.orderId}`;
  return chat.vendorId || '';
}

function getChatSubtitle(
  chat: VendorChat,
  userNames: Map<string, string>,
  serviceTitles: Map<string, string>,
  t: typeof translations['en']
): string {
  const parts: string[] = [];
  if (chat.serviceId && serviceTitles.get(chat.serviceId)) {
    parts.push(serviceTitles.get(chat.serviceId)!);
  }
  if (chat.orderId && chat.orderId !== 'support') {
    parts.push(`${t.order} #${chat.orderId}`);
  }
  return parts.join(' · ') || chat.lastMessage || '';
}

export default function ChatPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { language, direction } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const isVendor = dbUser?.type === 'vendor';
  const isAdmin = dbUser?.type === 'admin';

  const [chats, setChats] = useState<VendorChat[]>([]);
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());
  const [serviceTitles, setServiceTitles] = useState<Map<string, string>>(new Map());
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    if (authLoading || !dbUser || loadingChats) return;
    const orderId = sessionStorage.getItem('openChatOrderId');
    const vendorIdFromOrder = sessionStorage.getItem('openChatVendorId') || '';
    if (!orderId) return;
    sessionStorage.removeItem('openChatOrderId');
    sessionStorage.removeItem('openChatVendorId');

    const existingChat = chats.find(c => String(c.orderId) === String(orderId));
    if (existingChat?.id) {
      setSelectedChatId(existingChat.id);
      return;
    }

    const openOrderChat = async () => {
      try {
        // Admin uses the order's vendorId; vendor uses their own ID
        const vid = isAdmin ? vendorIdFromOrder : (dbUser.userid || dbUser.id);
        if (!vid) return;
        const chatId = await ensureOrderChat(
          orderId,
          vid,
          isAdmin ? undefined : dbUser.name,
          isAdmin ? undefined : dbUser.phoneNumber,
          isAdmin ? undefined : dbUser.profileImageUrl
        );
        setSelectedChatId(chatId);
      } catch {
        toast({ title: 'Failed to open chat', variant: 'destructive' });
      }
    };

    openOrderChat();
  }, [authLoading, dbUser, loadingChats, chats, toast]);

  // Admin: subscribe to all vendor chats
  useEffect(() => {
    if (authLoading || !dbUser || !isAdmin) return;
    setLoadingChats(true);
    const unsub = subscribeToVendorChats((data) => {
      setChats(data);
      setLoadingChats(false);
    });
    return () => unsub();
  }, [authLoading, dbUser, isAdmin]);

  // Vendor: subscribe to their own chats
  useEffect(() => {
    if (authLoading || !dbUser || !isVendor) return;
    const vid = dbUser.userid || dbUser.id || '';
    setLoadingChats(true);
    const unsub = subscribeToMyVendorChats(vid, (data) => {
      setChats(data);
      // Auto-select the first chat if only one
      if (data.length === 1 && !selectedChatId) {
        setSelectedChatId(data[0].id!);
        markVendorUnreadAsRead(data[0].id!).catch(() => {});
      }
      setLoadingChats(false);
    });
    return () => unsub();
  }, [authLoading, dbUser, isVendor]);

  // Resolve vendor/customer names and service titles whenever chat list changes
  useEffect(() => {
    if (chats.length === 0) return;

    const userIds = new Set<string>();
    const svcIds = new Set<string>();
    chats.forEach(c => {
      if (c.vendorId) userIds.add(c.vendorId);
      if (c.customerId) userIds.add(c.customerId);
      if (c.serviceId) svcIds.add(c.serviceId);
    });

    const userToFetch = [...userIds].filter(id => !userNames.has(id));
    if (userToFetch.length > 0) {
      Promise.all(
        userToFetch.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'Users', id));
            const name = snap.exists() ? (snap.data().name || snap.data().fullName || '') : '';
            return [id, name] as [string, string];
          } catch {
            return [id, ''] as [string, string];
          }
        })
      ).then((pairs) => {
        setUserNames(prev => {
          const next = new Map(prev);
          pairs.forEach(([id, name]) => { if (name) next.set(id, name); });
          return next;
        });
      });
    }

    const svcToFetch = [...svcIds].filter(id => !serviceTitles.has(id));
    if (svcToFetch.length > 0) {
      Promise.all(
        svcToFetch.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'services', id));
            const name = snap.exists() ? (snap.data().name || snap.data().title || '') : '';
            return [id, name] as [string, string];
          } catch {
            return [id, ''] as [string, string];
          }
        })
      ).then((pairs) => {
        setServiceTitles(prev => {
          const next = new Map(prev);
          pairs.forEach(([id, name]) => { if (name) next.set(id, name); });
          return next;
        });
      });
    }
  }, [chats]);

  // Subscribe to messages when a chat is selected
  useEffect(() => {
    if (!selectedChatId) return;
    if (isAdmin) markVendorMessagesAsRead(selectedChatId).catch(() => {});
    if (isVendor) markVendorUnreadAsRead(selectedChatId).catch(() => {});
    const unsub = subscribeToVendorMessages(selectedChatId, setMessages);
    return () => unsub();
  }, [selectedChatId, isAdmin, isVendor]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChatId || !dbUser) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const uid = dbUser.userid || dbUser.id || '';
      const role = isVendor ? 'vendor' : 'admin';
      await sendVendorMessage(selectedChatId, uid, dbUser.name || '', role, text);
    } catch {
      toast({ title: t.errorSend, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChatId || !dbUser) return;
    setUploadingImage(true);
    try {
      const url = await uploadFileClient(file, `chat/${selectedChatId}`);
      const uid = dbUser.userid || dbUser.id || '';
      const role = isVendor ? 'vendor' : 'admin';
      await sendVendorMessage(selectedChatId, uid, dbUser.name || '', role, '📷 Image', url);
    } catch {
      toast({ title: t.errorUpload, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleStartChat = async () => {
    if (!dbUser || startingChat) return;
    setStartingChat(true);
    try {
      const vid = dbUser.userid || dbUser.id || '';
      const chatId = await ensureVendorChat(vid, dbUser.name || '', dbUser.phoneNumber, dbUser.profileImageUrl);
      setSelectedChatId(chatId);
    } catch {
      toast({ title: t.errorSend, variant: 'destructive' });
    } finally {
      setStartingChat(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try { return format(parseISO(dateStr), 'hh:mm a'); } catch { return ''; }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { return format(parseISO(dateStr), 'dd MMM yyyy'); } catch { return ''; }
  };

  const filteredChats = chats.filter(c => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      c.vendorName?.toLowerCase().includes(lower) ||
      c.vendorId?.toLowerCase().includes(lower) ||
      c.orderId?.toLowerCase().includes(lower)
    );
  });

  // Deduplicate chats by orderId (if same orderId exists, keep only one)
  const deduplicatedChats = Array.from(
    new Map(
      filteredChats.map(chat => [
        chat.orderId || chat.id,  // Use orderId as key if exists, otherwise use chat id
        chat
      ])
    ).values()
  );

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const selectedName = selectedChat
    ? getChatDisplayName(selectedChat, userNames, t)
    : selectedChatId
      ? '...'
      : '';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background" dir={direction}>

      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r flex flex-col bg-background",
        selectedChatId && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">{isVendor ? t.chatWithSupport : t.conversations}</h2>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchConversations}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingChats ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : deduplicatedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-4">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">{t.noConversations}</p>
              {isVendor && (
                <Button onClick={handleStartChat} disabled={startingChat} size="sm">
                  {startingChat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {t.startChat}
                </Button>
              )}
            </div>
          ) : (
            <>
              {deduplicatedChats.map((chat) => {
                const displayName = getChatDisplayName(chat, userNames, t);
                const subtitle = getChatSubtitle(chat, userNames, serviceTitles, t) || chat.lastMessage;
                const unreadCount = isVendor ? (chat.unreadVendor || 0) : (chat.unreadAdmin || 0);
                const timeStr = formatTime(chat.lastlyactive as string);
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id!)}
                    className={cn("w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b text-left", selectedChatId === chat.id && "bg-muted")}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{displayName}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-1">{timeStr}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                        {unreadCount > 0 && (
                          <Badge className="h-5 min-w-[20px] flex items-center justify-center text-xs rounded-full shrink-0 ml-1">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {isVendor && (
                <div className="p-3 border-t">
                  <Button variant="outline" className="w-full" onClick={handleStartChat} disabled={startingChat} size="sm">
                    {startingChat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {t.startChat}
                  </Button>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>

      {/* Chat window */}
      <div className={cn("flex-1 flex flex-col", !selectedChatId && "hidden md:flex")}>
        {selectedChatId ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b bg-background">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChatId(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarFallback>{selectedName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{selectedName}</p>
                {selectedChat && (
                  <p className="text-xs text-muted-foreground">
                    {getChatSubtitle(selectedChat, userNames, serviceTitles, t)}
                    {isAdmin && selectedChat.customerId && (
                      <span> · {t.customer}: {userNames.get(selectedChat.customerId) || selectedChat.customerId}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <p className="text-sm">{t.noMessages}</p>
                  </div>
                ) : messages.map((msg, idx) => {
                  const isMe = msg.sentby === (dbUser?.userid || dbUser?.id);
                  const showDate = idx === 0 ||
                    formatDate(msg.timestamp as string) !== formatDate(messages[idx - 1].timestamp as string);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {formatDate(msg.timestamp as string)}
                          </span>
                        </div>
                      )}
                      <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2",
                          isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                        )}>
                          {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.senderName}</p>}
                          {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                              <img src={msg.imageUrl} alt="" className="rounded-lg max-w-full max-h-48 mb-1" />
                            </a>
                          )}
                          {msg.message && msg.message !== '📷 Image' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          )}
                          <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                            {formatTime(msg.timestamp as string)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                </Button>
                <Input
                  placeholder={t.typeMessage}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">{t.chat}</p>
            <p className="text-sm">{t.selectConversation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
