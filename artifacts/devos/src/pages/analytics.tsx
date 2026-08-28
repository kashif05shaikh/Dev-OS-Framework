import { useGetAnalyticsOverview, useGetCodingActivityAnalytics, useGetLearningProgressAnalytics } from "@workspace/api-client-react";
import { LineChart as LucideLineChart, Activity, Briefcase, Code2, BookOpen, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyticsRange } from "@workspace/api-client-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { format, parseISO } from "date-fns";

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('week');
  
  const { data: overview } = useGetAnalyticsOverview({ range });
  const { data: coding } = useGetCodingActivityAnalytics({ range });
  const { data: learning } = useGetLearningProgressAnalytics();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-8">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <LucideLineChart className="h-8 w-8 text-primary" />
            Analytics Deck
          </h1>
          <p className="text-muted-foreground mt-2">Macro-level view of your performance and output.</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
          <SelectTrigger className="w-[180px] font-bold"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past 7 Days</SelectItem>
            <SelectItem value="month">Past 30 Days</SelectItem>
            <SelectItem value="quarter">Past Quarter</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPIBox label="Total Study Time" value={`${Math.round((overview?.totalStudyMinutes || 0)/60)}h`} icon={<BookOpen className="h-5 w-5 text-emerald-500" />} />
        <KPIBox label="Total Coding Time" value={`${Math.round((overview?.totalCodingMinutes || 0)/60)}h`} icon={<Code2 className="h-5 w-5 text-blue-500" />} />
        <KPIBox label="Active Projects" value={overview?.totalProjects || 0} icon={<Layers className="h-5 w-5 text-purple-500" />} />
        <KPIBox label="Avg ATS Score" value={overview?.resumeAtsAverage || '--'} icon={<Briefcase className="h-5 w-5 text-orange-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Activity Chart */}
        <Card className="border-border shadow-sm col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Effort Output</CardTitle>
            <CardDescription>Coding vs Study minutes across the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {coding && coding.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={coding} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCode" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(22 100% 55%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(22 100% 55%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(180 80% 35%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(180 80% 35%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(parseISO(val), 'MMM d')} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelFormatter={(val) => format(parseISO(val as string), 'MMM d, yyyy')}
                    />
                    <Area type="monotone" dataKey="codingMinutes" name="Coding (min)" stroke="hsl(22 100% 55%)" strokeWidth={3} fillOpacity={1} fill="url(#colorCode)" />
                    <Area type="monotone" dataKey="studyMinutes" name="Study (min)" stroke="hsl(180 80% 35%)" strokeWidth={3} fillOpacity={1} fill="url(#colorStudy)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">Not enough data to graph.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Pipeline Breakdown */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Job Pipeline Distribution</CardTitle>
            <CardDescription>Current state of applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {overview && Object.keys(overview.jobStatusBreakdown).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(overview.jobStatusBreakdown).map(([name, value]) => ({ name: name.replace('_', ' '), value }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 'bold' }} width={100} style={{ textTransform: 'capitalize' }} />
                    <Tooltip cursor={{fill: 'hsl(var(--secondary))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">Pipeline is empty.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Subject Progress</CardTitle>
            <CardDescription>Topic completion by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {learning && learning.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={learning} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="subjectName" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip cursor={{fill: 'hsl(var(--secondary))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="totalTopics" name="Total Topics" fill="hsl(var(--secondary-foreground))" opacity={0.2} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completedTopics" name="Completed" fill="hsl(180 80% 35%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">No learning data available.</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function KPIBox({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="bg-card border-border shadow-sm flex flex-col justify-center p-4">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-black font-mono">{value}</div>
    </Card>
  );
}
