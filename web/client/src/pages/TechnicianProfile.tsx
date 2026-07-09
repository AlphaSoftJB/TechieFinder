import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE } from "@/const";
import { Wrench, Star, MapPin, Phone, Mail, Calendar } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function TechnicianProfile() {
  const params = useParams();
  const tech = { id: params.id, firstName: "Chukwudi", lastName: "Okonkwo", bio: "Professional plumber with 10+ years experience", yearsOfExperience: 10, averageRating: 4.8, totalRatings: 45, services: ["Plumbing", "Pipe Installation"], location: "Lagos", phoneNumber: "+234 803 123 4567", email: "chukwudi@example.com" };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/"><div className="flex items-center gap-2 cursor-pointer"><Wrench className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">{APP_TITLE}</span></div></Link>
          <Link href="/search"><Button variant="ghost">← Back</Button></Link>
        </div>
      </header>
      <div className="container py-8"><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><Card><CardHeader><div className="flex items-start gap-6"><div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">{tech.firstName[0]}{tech.lastName[0]}</div><div className="flex-1"><CardTitle className="text-3xl mb-2">{tech.firstName} {tech.lastName}</CardTitle><div className="flex items-center gap-4 text-sm text-muted-foreground mb-3"><div className="flex items-center gap-1"><MapPin className="h-4 w-4" />{tech.location}</div><div>{tech.yearsOfExperience}+ years</div></div><div className="flex items-center gap-2 mb-4"><div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < Math.floor(tech.averageRating) ? 'fill-accent text-accent' : 'text-muted'}`} />))}</div><span className="font-semibold">{tech.averageRating}</span><span className="text-muted-foreground">({tech.totalRatings})</span></div><div className="flex flex-wrap gap-2">{tech.services.map((s, i) => (<Badge key={i}>{s}</Badge>))}</div></div></div></CardHeader><CardContent><h3 className="font-semibold mb-2">About</h3><p className="text-muted-foreground">{tech.bio}</p></CardContent></Card></div><div><Card><CardHeader><CardTitle>Book Service</CardTitle></CardHeader><CardContent className="space-y-4"><Button className="w-full" size="lg" onClick={() => toast.success("Booking request sent!")}><Calendar className="mr-2 h-5 w-5" />Book Now</Button><div className="space-y-2 pt-4 border-t"><div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${tech.phoneNumber}`} className="text-primary hover:underline">{tech.phoneNumber}</a></div><div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${tech.email}`} className="text-primary hover:underline">{tech.email}</a></div></div></CardContent></Card></div></div></div>
    </div>
  );
}
