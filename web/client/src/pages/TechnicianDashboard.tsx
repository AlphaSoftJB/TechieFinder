import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Wrench, DollarSign, Star, Calendar, LogOut, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const jobs = [{ id: 1, clientName: "John Doe", service: "Plumbing Repair", date: "2024-02-20", status: "Pending" }, { id: 2, clientName: "Jane Smith", service: "Pipe Installation", date: "2024-02-22", status: "Accepted" }];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/"><div className="flex items-center gap-2 cursor-pointer"><Wrench className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">{APP_TITLE}</span></div></Link>
          <div className="flex items-center gap-4"><Link href="/search"><Button variant="ghost">Browse Jobs</Button></Link><Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button></div>
        </div>
      </header>
      <div className="container py-8"><div className="mb-6"><h1 className="text-3xl font-bold">Technician Dashboard</h1><p className="text-muted-foreground">Welcome back, {user?.firstName || "Technician"}!</p></div><div className="grid md:grid-cols-4 gap-6 mb-8"><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Earnings</p><p className="text-2xl font-bold">₦45,000</p></div><DollarSign className="h-8 w-8 text-primary" /></div></CardContent></Card><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Jobs</p><p className="text-2xl font-bold">{jobs.length}</p></div><Briefcase className="h-8 w-8 text-accent" /></div></CardContent></Card><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Rating</p><p className="text-2xl font-bold">4.8</p></div><Star className="h-8 w-8 text-accent fill-accent" /></div></CardContent></Card></div><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><Card><CardHeader><CardTitle>Job Requests</CardTitle></CardHeader><CardContent><div className="space-y-4">{jobs.map(j => (<div key={j.id} className="flex items-center justify-between p-4 border rounded-lg"><div><p className="font-semibold">{j.clientName}</p><p className="text-sm text-muted-foreground">{j.service} • {j.date}</p></div><div className="flex gap-2">{j.status === 'Pending' ? (<><Button size="sm">Accept</Button><Button size="sm" variant="outline">Decline</Button></>) : (<span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">{j.status}</span>)}</div></div>))}</div></CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="space-y-2"><Button variant="outline" className="w-full">Manage Services</Button><Button variant="outline" className="w-full">Update Availability</Button><Button variant="outline" className="w-full">View Portfolio</Button><Button variant="outline" className="w-full">Earnings Report</Button></CardContent></Card></div></div></div>
    </div>
  );
}
