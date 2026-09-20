import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SlidersManager from '@/components/sliders/sliders-manager';
import BannerManager from '@/components/banner/banner-manager';

export default function SlidersPage() {
  return (
    <div className="p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Sliders</CardTitle>
          <CardDescription>Manage your sliding banners here.</CardDescription>
        </CardHeader>
        <CardContent>
          <SlidersManager />
        </CardContent>
      </Card>

      <BannerManager />
    </div>
  );
}
