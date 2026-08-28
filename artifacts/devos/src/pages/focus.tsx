import { useGetActiveFocusSession, useStartFocusSession, useStopFocusSession, useListFocusSessions } from "@workspace/api-client-react";
import { Timer, Play, Square, List, BrainCircuit, Code2, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FocusCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetActiveFocusSessionQueryKey, getListFocusSessionsQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInSeconds } from "date-fns";

export default function FocusPage() {
  const qc = useQueryClient();
  const { data: activeSession } = useGetActiveFocusSession();
  const { data: sessions } = useListFocusSessions({});
  
  const start = useStartFocusSession();
  const stop = useStopFocusSession();

  const [category, setCategory] = useState<FocusCategory>('coding');
  const [label, setLabel] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Timer tick
  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      const startD = parseISO(activeSession.startedAt!);
      setElapsed(differenceInSeconds(new Date(), startD));
    };
    tick();
    const int = setInterval(tick, 1000);
    return () => clearInterval(int);
  }, [activeSession]);

  const handleStart = () => {
    start.mutate({ data: { category, label: label || undefined } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetActiveFocusSessionQueryKey() });
        setLabel("");
      }
    });
  };

  const handleStop = () => {
    stop.mutate({ id: activeSession!.id! }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetActiveFocusSessionQueryKey() });
        qc.invalidateQueries({ queryKey: getListFocusSessionsQueryKey({}) });
      }
    });
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCatIcon = (cat?: string) => {
    if(cat === 'study') return <BrainCircuit className="h-5 w-5 text-emerald-500" />;
    if(cat === 'project') return <Briefcase className="h-5 w-5 text-purple-500" />;
    return <Code2 className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 items-center justify-center px-4">
      <div className="w-full max-w-xl flex flex-col gap-8">
        
        <div className="text-center mb-4">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-3">
            <Timer className="h-10 w-10 text-primary" />
            Deep Work
          </h1>
          <p className="text-muted-foreground mt-3">Block distractions. Log your focused effort.</p>
        </div>

        <Card className={cn(
          "border-border shadow-xl overflow-hidden transition-all duration-500 transform relative",
          activeSession ? "ring-2 ring-primary scale-[1.02]" : ""
        )}>
          {activeSession && <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />}
          
          <CardContent className="p-10 flex flex-col items-center relative z-10">
             <div className="text-8xl font-black font-mono tracking-tighter mb-8 drop-shadow-sm text-foreground">
               {formatTime(elapsed)}
             </div>

             {activeSession ? (
               <div className="w-full flex flex-col items-center gap-6">
                 <div className="flex items-center gap-3 bg-background border border-border px-4 py-2 rounded-full shadow-sm">
                   {getCatIcon(activeSession.category)}
                   <span className="font-bold text-sm">{activeSession.label || (activeSession.category ?? '').toUpperCase()}</span>
                 </div>
                 <Button size="lg" variant="destructive" onClick={handleStop} className="w-full h-14 text-lg font-bold shadow-md hover:bg-destructive/90 gap-2">
                   <Square className="h-5 w-5 fill-current" /> Stop Session
                 </Button>
               </div>
             ) : (
               <div className="w-full flex flex-col gap-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
                     <Select value={category} onValueChange={v => setCategory(v as FocusCategory)}>
                       <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="coding">Coding Drill</SelectItem>
                         <SelectItem value="study">Learning</SelectItem>
                         <SelectItem value="project">Project Dev</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label className="text-xs uppercase tracking-wider text-muted-foreground">Focus Goal (Optional)</Label>
                     <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Graph Algorithms" className="mt-1" />
                   </div>
                 </div>
                 <Button size="lg" onClick={handleStart} className="w-full h-14 mt-4 text-lg font-bold shadow-md gap-2" disabled={start.isPending}>
                   <Play className="h-5 w-5 fill-current" /> Start Focus
                 </Button>
               </div>
             )}
          </CardContent>
        </Card>

        {sessions && sessions.length > 0 && !activeSession && (
          <div className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2 justify-center">
              <List className="h-4 w-4" /> Recent Sessions
            </h3>
            <div className="grid gap-2">
              {sessions.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-card border border-border rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded border border-border">
                       {getCatIcon(s.category)}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{s.label || s.category.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{format(parseISO(s.startedAt), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold">{s.durationMinutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
