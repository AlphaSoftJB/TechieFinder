import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE } from "@/const";
import { Wrench, Search as SearchIcon, MapPin, Star, Filter, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  bio?: string;
  yearsOfExperience?: number;
  averageRating?: number;
  totalRatings?: number;
  services?: string[];
  location?: string;
}

export default function Search() {
  const [location] = useLocation();
  const [technicians, setTechnicians] = useState<Technician[]>([
    {
      id: 1,
      firstName: "Chukwudi",
      lastName: "Okonkwo",
      email: "chukwudi@example.com",
      phoneNumber: "+234 803 123 4567",
      bio: "Professional plumber with 10 years experience",
      yearsOfExperience: 10,
      averageRating: 4.8,
      totalRatings: 45,
      services: ["Plumbing", "Pipe Installation"],
      location: "Lagos, Nigeria"
    },
    {
      id: 2,
      firstName: "Aisha",
      lastName: "Mohammed",
      email: "aisha@example.com",
      phoneNumber: "+234 805 234 5678",
      bio: "Licensed electrician specializing in residential wiring",
      yearsOfExperience: 7,
      averageRating: 4.9,
      totalRatings: 62,
      services: ["Electrical", "Wiring"],
      location: "Abuja, Nigeria"
    },
    {
      id: 3,
      firstName: "Emeka",
      lastName: "Nwosu",
      email: "emeka@example.com",
      phoneNumber: "+234 807 345 6789",
      bio: "Expert carpenter and furniture maker",
      yearsOfExperience: 12,
      averageRating: 4.7,
      totalRatings: 38,
      services: ["Carpentry", "Furniture"],
      location: "Port Harcourt, Nigeria"
    }
  ]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategories();
    const params = new URLSearchParams(location.split('?')[1]);
    const q = params.get('q');
    const category = params.get('category');
    if (q) setSearchQuery(q);
    if (category) setSelectedCategory(category);
  }, [location]);

  const loadCategories = async () => {
    try {
      const catData = await api.getServiceCategories();
      setCategories(catData || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = searchQuery === "" || 
      `${tech.firstName} ${tech.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.services?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || 
      tech.services?.some(s => s.toLowerCase() === selectedCategory.toLowerCase());
    
    const matchesRating = selectedRating === "all" || 
      (tech.averageRating && tech.averageRating >= parseFloat(selectedRating));
    
    return matchesSearch && matchesCategory && matchesRating;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Wrench className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/search"><Button variant="ghost">Find Technicians</Button></Link>
            <Link href="/login"><Button variant="ghost">Login</Button></Link>
            <Link href="/register"><Button>Get Started</Button></Link>
          </nav>
        </div>
      </header>

      <section className="bg-muted/30 py-8 border-b">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl font-bold">Find Skilled Technicians</h1>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search by name or service..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline"><Filter className="h-5 w-5 mr-2" />Filters</Button>
            </div>
            {showFilters && (
              <Card><CardContent className="pt-6"><div className="grid md:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (<SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div><label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                  <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger><SelectValue placeholder="Any Rating" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Any Rating</SelectItem><SelectItem value="4.5">4.5+ Stars</SelectItem><SelectItem value="4.0">4.0+ Stars</SelectItem><SelectItem value="3.5">3.5+ Stars</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-end"><Button variant="outline" className="w-full" onClick={() => {setSelectedCategory("all");setSelectedRating("all");setSearchQuery("");}}><X className="h-4 w-4 mr-2" />Clear Filters</Button></div>
              </div></CardContent></Card>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 flex-1"><div className="container"><div className="mb-6"><p className="text-muted-foreground">Found {filteredTechnicians.length} technician{filteredTechnicians.length !== 1 ? 's' : ''}</p></div>
        {loading ? (<div className="text-center py-12"><p className="text-muted-foreground">Loading technicians...</p></div>) : filteredTechnicians.length === 0 ? (
          <div className="text-center py-12"><Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No technicians found</h3><p className="text-muted-foreground mb-4">Try adjusting your search or filters</p><Button onClick={() => {setSearchQuery("");setSelectedCategory("all");setSelectedRating("all");}}>Clear All Filters</Button></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTechnicians.map((tech) => (<Link key={tech.id} href={`/technician/${tech.id}`}><Card className="hover:shadow-lg transition-shadow cursor-pointer h-full"><CardHeader><div className="flex items-start gap-4"><div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">{tech.firstName[0]}{tech.lastName[0]}</div><div className="flex-1"><CardTitle className="text-lg">{tech.firstName} {tech.lastName}</CardTitle><CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{tech.location || "Nigeria"}</CardDescription></div></div></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground line-clamp-2">{tech.bio || "Professional technician"}</p><div className="flex flex-wrap gap-2">{tech.services?.slice(0, 3).map((service, idx) => (<Badge key={idx} variant="secondary">{service}</Badge>))}</div><div className="flex items-center justify-between pt-2 border-t"><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" /><span className="font-semibold">{tech.averageRating?.toFixed(1) || "N/A"}</span><span className="text-sm text-muted-foreground">({tech.totalRatings || 0})</span></div><span className="text-sm text-muted-foreground">{tech.yearsOfExperience || 0}+ years</span></div></CardContent></Card></Link>))}
          </div>
        )}</div></section>
    </div>
  );
}
