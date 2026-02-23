
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from "recharts";
import { Eye, Heart, Star, Users, Briefcase } from "lucide-react";

const DATA = [
  { name: "Jan", views: 400, likes: 240 },
  { name: "Feb", views: 300, likes: 139 },
  { name: "Mar", views: 200, likes: 980 },
  { name: "Apr", views: 278, likes: 390 },
  { name: "May", views: 189, likes: 480 },
  { name: "Jun", views: 239, likes: 380 },
  { name: "Jul", views: 349, likes: 430 },
];

export default function AnalyticsPage() {
  const stats = [
    { label: "Total Ideas", value: "12", icon: Briefcase, color: "text-blue-500" },
    { label: "Total Views", value: "4.2k", icon: Eye, color: "text-purple-500" },
    { label: "Avg Rating", value: "4.8", icon: Star, color: "text-yellow-500" },
    { label: "Collabs", value: "8", icon: Users, color: "text-green-500" },
  ];

  return (
    <div className="max-w-md mx-auto p-6 pb-24 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">Your Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tracking your innovation impact</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none idea-card-shadow rounded-2xl">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className={`${stat.color} bg-muted/50 p-2 rounded-xl`}>
                <stat.icon size={20} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none idea-card-shadow rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Eye size={16} /> Idea Views Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pr-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none idea-card-shadow rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Heart size={16} /> Engagement (Likes)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pr-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="likes" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
