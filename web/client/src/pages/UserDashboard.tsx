import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Wrench, User, MapPin, CreditCard, Calendar, LogOut } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const bookings = [{ id: 1, technicianName: "Chukwudi Okonkwo", service: "Plumbing", date: "2024-02-15", status: "Completed" }, { id: 2, technicianName: "Aisha Mohammed", service: "Electrical", date: "2024-02-20", status: "Scheduled" }];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/"><div className="flex items-center gap-2 cursor-pointer"><Wrench className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">{APP_TITLE}</span></div></Link>
          <div className="flex items-center gap-4"><Link href="/search"><Button variant="ghost">Find Technicians</Button></Link><Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button></div>
        </div>
      </header>
      <div className="container py-8"><div className="mb-6"><h1 className="text-3xl font-bold">My Dashboard</h1><p className="text-muted-foreground">Welcome back, {user?.firstName || "User"}!</p></div><div className="grid md:grid-cols-4 gap-6 mb-8"><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Bookings</p><p className="text-2xl font-bold">{bookings.length}</p></div><Calendar className="h-8 w-8 text-primary" /></div></CardContent></Card><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">1</p></div><Calendar className="h-8 w-8 text-accent" /></div></CardContent></Card></div><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><Card><CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader><CardContent><div className="space-y-4">{bookings.map(b => (<div key={b.id} className="flex items-center justify-between p-4 border rounded-lg"><div><p className="font-semibold">{b.technicianName}</p><p className="text-sm text-muted-foreground">{b.service} • {b.date}</p></div><span className={`px-3 py-1 rounded-full text-sm ${b.status === 'Completed' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{b.status}</span></div>))}</div></CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile</CardTitle></CardHeader><CardContent><Button variant="outline" className="w-full">Edit Profile</Button></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Addresses</CardTitle></CardHeader><CardContent><Button variant="outline" className="w-full">Manage Addresses</Button></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payment Methods</CardTitle></CardHeader><CardContent><Button variant="outline" className="w-full">Manage Payments</Button></CardContent></Card></div></div></div>
    </div>
  );
}
