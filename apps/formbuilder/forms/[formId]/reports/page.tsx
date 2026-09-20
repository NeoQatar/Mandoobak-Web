'use client';

import {useQuery} from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {getForm, getFormResponses} from '@/lib/firebaseService/forms';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Loader2} from 'lucide-react';
import type {Form, FormResponse} from '@/types/forms';

// Helper to process responses for chart data
const processChartData = (
  form: Form | undefined,
  responses: FormResponse[] | undefined
) => {
  if (!form || !responses) return {};

  const analytics: Record<string, any> = {};

  form.elements.forEach(element => {
    if (
      element.type === 'multiple-choice' ||
      element.type === 'dropdown' ||
      element.type === 'checkboxes'
    ) {
      const counts: Record<string, number> = {};
      element.options?.forEach(opt => {
        counts[opt.value] = 0;
      });

      responses.forEach(response => {
        const answer = response.data[element.id];
        if (element.type === 'checkboxes' && typeof answer === 'object') {
          for (const key in answer) {
            if (answer[key] === true) {
              const optionLabel = element.options?.find(o => o.id === key)?.value;
              if (optionLabel) counts[optionLabel]++;
            }
          }
        } else if (typeof answer === 'string' && counts[answer] !== undefined) {
          counts[answer]++;
        }
      });

      analytics[element.id] = Object.entries(counts).map(([name, value]) => ({
        name,
        count: value,
      }));
    } else {
      analytics[element.id] = responses
        .map(r => r.data[element.id])
        .filter(Boolean);
    }
  });

  return analytics;
};

export default function ReportsPage({params}: {params: {formId: string}}) {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId');

  const {
    data: form,
    isLoading: isFormLoading,
    isError: isFormError,
  } = useQuery<Form>({
    queryKey: ['form', serviceId, params.formId],
    queryFn: () => {
        if (!serviceId) throw new Error("Service ID is required.");
        return getForm(serviceId, params.formId);
    },
    enabled: !!serviceId,
  });

  const {
    data: responses,
    isLoading: areResponsesLoading,
    isError: areResponsesError,
  } = useQuery<FormResponse[]>({
    queryKey: ['formResponses', serviceId, params.formId],
    queryFn: () => {
        if (!serviceId) throw new Error("Service ID is required.");
        return getFormResponses(serviceId, params.formId);
    },
    enabled: !!serviceId,
  });

  const isLoading = isFormLoading || areResponsesLoading;
  const isError = isFormError || areResponsesError;

  const analyticsData = processChartData(form, responses);
  
  if (!serviceId) {
     return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-destructive">
            Missing Service ID
          </h2>
          <p>Reports can't be loaded without a service ID in the URL.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Failed to load form reports.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{form.name}</h2>
          <p className="text-muted-foreground">Reports & Responses</p>
        </div>
      </div>
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{responses?.length || 0}</p>
            </CardContent>
          </Card>
          {form.elements.map(element => (
            <Card key={element.id}>
              <CardHeader>
                <CardTitle>{element.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {(element.type === 'multiple-choice' ||
                  element.type === 'dropdown' ||
                  element.type === 'checkboxes') && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData[element.id]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {(element.type === 'short-answer' ||
                  element.type === 'long-answer') && (
                  <ul className="list-disc pl-5 space-y-2">
                    {analyticsData[element.id]?.slice(0, 5).map((answer: string, i: number) => (
                      <li key={i} className="text-sm">
                        {answer}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="individual">
          <div className="space-y-4">
            {responses?.map(response => (
              <Card key={response.id}>
                <CardHeader>
                  <CardTitle>Response #{response.id}</CardTitle>
                  <CardDescription>
                    Submitted on{' '}
                    {new Date(response.submittedAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {form.elements.map(element => (
                    <div key={element.id}>
                      <h4 className="font-semibold">{element.label}</h4>
                      <p className="text-muted-foreground">
                        {typeof response.data[element.id] === 'object'
                          ? JSON.stringify(response.data[element.id])
                          : response.data[element.id] || 'Not answered'}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
