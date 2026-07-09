import { useGetDailyGoal, useListTasksToday, useListHabits, useCreateTaskToday, useUpdateTaskToday, useDeleteTaskToday, useUpsertDailyGoal, useToggleHabitCheckin, useCreateHabit } from "@workspace/api-client-react";
import { Target, CheckCircle2, Circle, Plus, Flame, Activity, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDailyGoalQueryKey, getListTasksTodayQueryKey, getListHabitsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function GoalsPage() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: goal } = useGetDailyGoal({ date: todayStr }, { query: { enabled: true } as any });
  const { data: tasks } = useListTasksToday({ date: todayStr }, { query: { enabled: true } as any });
  const { data: habits } = useListHabits();

  const studyPct = goal ? Math.min(100, Math.round((goal.studyMinutesActual / goal.studyMinutesTarget) * 100)) || 0 : 0;
  const codePct = goal ? Math.min(100, Math.round((goal.codingMinutesActual / goal.codingMinutesTarget) * 100)) || 0 : 0;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Goals & Habits
          </h1>
          <p className="text-muted-foreground mt-2">Daily checklist, time targets, and streak tracking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        
        {/* Left Col: Targets & Tasks */}
        <div className="flex flex-col gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20">
               <div className="flex justify-between items-center">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Clock className="h-5 w-5 text-primary" /> Daily Time Targets
                 </CardTitle>
                 <SetGoalsDialog date={todayStr} current={goal} />
               </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-6">
               <div>
                 <div className="flex justify-between items-end mb-2">
                   <span className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Study Target</span>
                   <span className="font-mono font-black text-xl">{goal?.studyMinutesActual || 0} <span className="text-sm text-muted-foreground">/ {goal?.studyMinutesTarget || 60}m</span></span>
                 </div>
                 <Progress value={studyPct} className="h-3" />
               </div>
               <div>
                 <div className="flex justify-between items-end mb-2">
                   <span className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Coding Target</span>
                   <span className="font-mono font-black text-xl">{goal?.codingMinutesActual || 0} <span className="text-sm text-muted-foreground">/ {goal?.codingMinutesTarget || 120}m</span></span>
                 </div>
                 <Progress value={codePct} className="h-3 [&>div]:bg-emerald-500" />
               </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20 flex-shrink-0">
               <div className="flex justify-between items-center">
                 <CardTitle className="text-base flex items-center gap-2">
                   <CheckCircle2 className="h-5 w-5 text-blue-500" /> Action List
                 </CardTitle>
                 <AddTaskDialog date={todayStr} />
               </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
               <ul className="divide-y divide-border">
                 {tasks?.map(task => (
                   <TaskItem key={task.id} task={task} date={todayStr} />
                 ))}
                 {tasks?.length === 0 && (
                   <li className="p-8 text-center text-muted-foreground text-sm italic">No tasks defined for today.</li>
                 )}
               </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Habits */}
        <div className="flex flex-col gap-6">
          <Card className="bg-card border-border shadow-sm flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20 flex-shrink-0">
               <div className="flex justify-between items-center">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Activity className="h-5 w-5 text-orange-500" /> Daily Habits
                 </CardTitle>
                 <AddHabitDialog />
               </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto content-start">
               {habits?.map(habit => (
                 <HabitCard key={habit.id} habit={habit} date={todayStr} />
               ))}
               {habits?.length === 0 && (
                 <div className="col-span-full py-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                   No habits tracked. Start building consistency.
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function TaskItem({ task, date }: { task: any, date: string }) {
  const qc = useQueryClient();
  const update = useUpdateTaskToday();
  const remove = useDeleteTaskToday();

  const toggle = () => {
    update.mutate({ id: task.id, data: { done: !task.done } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksTodayQueryKey({ date }) })
    });
  };

  const drop = () => {
    remove.mutate({ id: task.id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksTodayQueryKey({ date }) })
    });
  };

  return (
    <li className="p-4 hover:bg-secondary/30 flex items-center gap-3 group transition-colors">
      <button onClick={toggle} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
        {task.done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
      </button>
      <span className={cn("flex-1 text-sm font-medium", task.done && "text-muted-foreground line-through opacity-70")}>{task.title}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity" onClick={drop}>
        &times;
      </Button>
    </li>
  );
}

function HabitCard({ habit, date }: { habit: any, date: string }) {
  const qc = useQueryClient();
  const checkin = useToggleHabitCheckin();

  const toggle = () => {
    checkin.mutate({ id: habit.id, data: { date } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListHabitsQueryKey() })
    });
  };

  return (
    <div className={cn(
      "border p-4 rounded-xl flex flex-col transition-all",
      habit.checkedInToday ? "border-primary bg-primary/5 shadow-md" : "border-border bg-background shadow-sm hover:border-primary/30"
    )}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-bold text-sm leading-tight flex-1 pr-2">{habit.name}</h4>
        <button 
          onClick={toggle}
          className={cn(
            "flex-shrink-0 h-6 w-6 rounded-md border flex items-center justify-center transition-colors",
            habit.checkedInToday ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted-foreground/40 hover:border-primary"
          )}
        >
          {habit.checkedInToday && <CheckCircle2 className="h-4 w-4" />}
        </button>
      </div>
      
      <div className="mt-auto flex items-center justify-between">
         <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 text-orange-600">
           <Flame className="h-3.5 w-3.5" />
           <span className="font-mono font-bold text-xs">{habit.currentStreak} day</span>
         </div>
         <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Max {habit.longestStreak}</span>
      </div>
    </div>
  );
}

function SetGoalsDialog({ date, current }: { date: string, current: any }) {
  const [open, setOpen] = useState(false);
  const [study, setStudy] = useState(current?.studyMinutesTarget?.toString() || "60");
  const [code, setCode] = useState(current?.codingMinutesTarget?.toString() || "120");
  const qc = useQueryClient();
  const upsert = useUpsertDailyGoal();

  const handleSave = () => {
    upsert.mutate({ data: { date, studyMinutesTarget: Number(study), codingMinutesTarget: Number(code) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetDailyGoalQueryKey({ date }) });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold gap-1"><Plus className="h-3 w-3"/> Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Set Daily Targets</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <Label>Study Minutes</Label>
            <Input type="number" value={study} onChange={e => setStudy(e.target.value)} className="mt-1 font-mono" />
          </div>
          <div>
            <Label>Coding Minutes</Label>
            <Input type="number" value={code} onChange={e => setCode(e.target.value)} className="mt-1 font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const qc = useQueryClient();
  const create = useCreateTaskToday();

  const handleSave = () => {
    if(!title) return;
    create.mutate({ data: { date, title } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTasksTodayQueryKey({ date }) });
        setOpen(false);
        setTitle("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold gap-1"><Plus className="h-3 w-3"/> Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Daily Task</DialogTitle></DialogHeader>
        <div className="py-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done today?" className="mt-1" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!title || create.isPending}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddHabitDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const create = useCreateHabit();

  const handleSave = () => {
    if(!name) return;
    create.mutate({ data: { name, color: "#f97316" } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListHabitsQueryKey() });
        setOpen(false);
        setName("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold gap-1"><Plus className="h-3 w-3"/> New</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Track New Habit</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label>Habit Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Read 10 pages" className="mt-1" />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!name || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
