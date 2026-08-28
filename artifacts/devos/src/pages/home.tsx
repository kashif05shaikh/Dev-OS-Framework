import { useGetDashboardSummary, useGetProfile } from "@workspace/api-client-react";
import { Loader2, TrendingUp, Code2, BookOpen, Target, CheckCircle2, AlertCircle, Briefcase, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useUser } from "@clerk/react";

export default function HomePage() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: profile } = useGetProfile();
  const { user } = useUser();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loadingSummary) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-mono text-sm font-bold uppercase tracking-widest">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  // Normalize to always be an array (guards against stale cache with old { total, done } shape)
  const tasksToday = Array.isArray(summary.tasksToday) ? summary.tasksToday : [];
  const upcomingDeadlines = Array.isArray(summary.upcomingDeadlines) ? summary.upcomingDeadlines : [];
  const recentNotes = Array.isArray(summary.recentNotes) ? summary.recentNotes : [];
  const activeProjects = Array.isArray(summary.activeProjects) ? summary.activeProjects : [];

  const totalGoalMinutes = 240;
  const totalActualMinutes = (summary.todayStudyMinutes ?? 0) + (summary.todayCodingMinutes ?? 0);
  const progressPct = Math.min(100, Math.round((totalActualMinutes / totalGoalMinutes) * 100));

  const formatDeadlineDate = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return <span className="text-destructive font-bold">Today</span>;
    if (isTomorrow(d)) return <span className="text-orange-500 font-bold">Tomorrow</span>;
    return format(d, "MMM d, yyyy");
  };

  const getDeadlineIcon = (type: string) => {
    switch (type) {
      case 'project': return <Briefcase className="h-3 w-3" />;
      case 'job': return <Target className="h-3 w-3" />;
      case 'topic': return <BookOpen className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {getGreeting()}, <span className="text-primary">{profile?.displayName || user?.firstName || 'Developer'}</span>.
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">System nominal. Here's your status for today.</p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-lg shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Productivity Score</span>
            <span className="text-2xl font-black text-foreground font-mono">{summary.productivityScore}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Grid 1: Daily Stats & Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border-border shadow-sm bg-card hover-elevate transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Today's Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Total Time Invested</span>
              <span className="text-sm font-mono font-bold">{totalActualMinutes} / {totalGoalMinutes} min</span>
            </div>
            <Progress value={progressPct} className="h-3 mb-6" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-500 rounded-md border border-blue-500/30">
                  <Code2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Coding</p>
                  <p className="text-2xl font-black font-mono">{summary.todayCodingMinutes}<span className="text-sm text-muted-foreground ml-1">min</span></p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-md border border-emerald-500/30">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Learning</p>
                  <p className="text-2xl font-black font-mono">{summary.todayStudyMinutes}<span className="text-sm text-muted-foreground ml-1">min</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Daily Action List
              </CardTitle>
              <Link href="/goals" className="text-xs text-primary hover:underline">Manage</Link>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-0">
              {tasksToday.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground italic">No tasks set for today.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {tasksToday.map((task) => (
                    <li key={task.id} className="p-3 hover:bg-secondary/30 flex items-center gap-3 transition-colors">
                      <div className={cn(
                        "flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center",
                        task.done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 bg-background"
                      )}>
                        {task.done && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      <span className={cn("text-sm truncate", task.done ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
                        {task.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Grid 2: Deadlines & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Incoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {upcomingDeadlines.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Clear skies. No upcoming deadlines.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {upcomingDeadlines.slice(0, 5).map((deadline, idx) => (
                    <li key={idx} className="p-4 hover:bg-secondary/30 flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 overflow-hidden">
                        <div className="mt-1 p-1.5 rounded-sm bg-secondary border border-border text-muted-foreground">
                          {getDeadlineIcon(deadline.sourceType)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{deadline.sourceType}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm border border-border px-2 py-1 rounded bg-background shadow-sm">
                          {formatDeadlineDate(deadline.dueAt)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Recent Notes
              </CardTitle>
              <Link href="/notes" className="text-xs text-primary hover:underline">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentNotes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No notes created yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {recentNotes.slice(0, 5).map((note) => (
                  <li key={note.id} className="p-4 hover:bg-secondary/30">
                    <Link href={`/notes?id=${note.id}`} className="block">
                      <div className="flex items-center gap-2 mb-1">
                        {note.pinned && <div className="w-2 h-2 rounded-full bg-primary" />}
                        <p className="font-semibold text-sm truncate flex-1">{note.title}</p>
                        <span className="text-[10px] text-muted-foreground">{format(parseISO(note.updatedAt), 'MMM d')}</span>
                      </div>
                      <div className="flex gap-1 overflow-hidden mt-2">
                        {note.tags?.map(t => (
                          <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm">#{t}</Badge>
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid 3: Job Pipeline & Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-500" />
              Job Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(summary.jobPipeline).length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">Pipeline empty.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(summary.jobPipeline).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <span className="font-mono font-bold bg-secondary px-2 py-0.5 rounded text-sm">{count}</span>
                  </div>
                ))}
                <div className="pt-4 mt-2 border-t border-border">
                  <Link href="/jobs" className="text-sm text-primary font-medium hover:underline block text-center w-full">Go to Board</Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 border-border shadow-sm bg-card hover-elevate transition-all">
          <CardHeader className="pb-3 border-b border-border/50">
             <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Active Projects
              </CardTitle>
              <Link href="/projects" className="text-xs text-primary hover:underline">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {activeProjects.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No active projects. Time to build something!</div>
              ) : (
                <ul className="divide-y divide-border">
                  {activeProjects.slice(0, 3).map((project) => (
                    <li key={project.id} className="p-4 hover:bg-secondary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm">{project.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{project.techStack.join(' • ')}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "uppercase text-[10px] tracking-widest",
                          project.status === 'in_progress' ? "border-primary text-primary" : ""
                        )}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <Progress value={project.progressPercent} className="flex-1 h-1.5" />
                        <span className="text-xs font-mono font-bold w-8 text-right">{project.progressPercent}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
