import { useListCalendarEvents, useListUpcomingDeadlines, useCreateCalendarEvent, useDeleteCalendarEvent } from "@workspace/api-client-react";
import { Calendar as CalendarIcon, Clock, AlertCircle, Plus, Trash2, MapPin, AlignLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarEventType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListCalendarEventsQueryKey } from "@workspace/api-client-react";
import { format, parseISO, isSameDay, startOfWeek, addDays, endOfWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { data: events } = useListCalendarEvents({});
  const { data: deadlines } = useListUpcomingDeadlines();

  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Schedule & Deadlines
          </h1>
          <p className="text-muted-foreground mt-2">Centralized timeline for interviews, learning, and releases.</p>
        </div>
        <AddEventDialog />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* Weekly Calendar View */}
        <div className="w-full lg:w-2/3 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
             <h2 className="font-bold text-lg">This Week</h2>
             <span className="text-sm font-mono text-muted-foreground bg-background px-3 py-1 rounded border border-border">
               {format(startDate, 'MMM d')} - {format(endOfWeek(today, {weekStartsOn: 1}), 'MMM d, yyyy')}
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
             {weekDays.map((day, i) => {
               const dayEvents = events?.filter(e => isSameDay(parseISO(e.startAt), day)) || [];
               const isTodayDate = isSameDay(today, day);
               
               return (
                 <div key={i} className={cn(
                   "flex gap-4 p-4 rounded-lg border",
                   isTodayDate ? "bg-primary/5 border-primary/30" : "bg-background border-border"
                 )}>
                   <div className="w-16 flex flex-col items-center justify-center flex-shrink-0 border-r border-border pr-4">
                     <span className={cn("text-xs font-bold uppercase tracking-widest", isTodayDate ? "text-primary" : "text-muted-foreground")}>{format(day, 'EEE')}</span>
                     <span className={cn("text-2xl font-black font-mono leading-none mt-1", isTodayDate ? "text-primary" : "text-foreground")}>{format(day, 'dd')}</span>
                   </div>
                   
                   <div className="flex-1 flex flex-col gap-2">
                     {dayEvents.length === 0 ? (
                       <span className="text-sm text-muted-foreground italic my-auto">No events scheduled.</span>
                     ) : (
                       dayEvents.map(e => (
                         <EventItem key={e.id} event={e} />
                       ))
                     )}
                   </div>
                 </div>
               )
             })}
          </div>
        </div>

        {/* Unified Deadlines Feed */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
           <Card className="bg-card border-border shadow-sm flex-1 flex flex-col overflow-hidden">
             <CardHeader className="pb-3 border-b border-border bg-secondary/20">
               <CardTitle className="text-base flex items-center gap-2">
                 <AlertCircle className="h-5 w-5 text-orange-500" /> Cross-Entity Deadlines
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0 flex-1 overflow-y-auto">
               <ul className="divide-y divide-border">
                 {deadlines?.map((d, i) => (
                   <li key={i} className="p-4 hover:bg-secondary/30 transition-colors">
                     <div className="flex justify-between items-start gap-4">
                       <div className="min-w-0">
                         <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-1.5 py-0 mb-2 bg-background text-muted-foreground">{d.sourceType}</Badge>
                         <p className="font-bold text-sm leading-snug">{d.title}</p>
                       </div>
                       <div className="text-right flex-shrink-0">
                         <div className="text-xs font-mono font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-1 rounded">
                           {format(parseISO(d.dueAt), 'MMM d')}
                         </div>
                       </div>
                     </div>
                   </li>
                 ))}
                 {deadlines?.length === 0 && (
                   <li className="p-8 text-center text-muted-foreground text-sm">No upcoming deadlines detected.</li>
                 )}
               </ul>
             </CardContent>
           </Card>
        </div>

      </div>
    </div>
  );
}

function EventItem({ event }: { event: any }) {
  const qc = useQueryClient();
  const deleteMutation = useDeleteCalendarEvent();

  const handleDelete = () => {
    if(confirm("Delete event?")) {
      deleteMutation.mutate({ id: event.id }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListCalendarEventsQueryKey({}) })
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'interview': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'contest': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'study': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-secondary text-foreground border-border';
    }
  };

  return (
    <div className="flex justify-between items-start p-3 bg-card border border-border rounded shadow-sm group">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0", getTypeColor(event.type))}>
            {event.type}
          </Badge>
          <span className="text-xs font-mono font-bold text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {format(parseISO(event.startAt), 'HH:mm')}
          </span>
        </div>
        <p className="font-bold text-sm">{event.title}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleDelete}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEventType>('custom');
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const qc = useQueryClient();
  const create = useCreateCalendarEvent();

  const handleSave = () => {
    if(!title || !date || !time) return;
    const startAt = `${date}T${time}:00Z`; // Simple ISO format assuming local input matches roughly
    create.mutate({ data: { title, type, startAt } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCalendarEventsQueryKey({}) });
        setOpen(false);
        setTitle("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Event</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Event Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Google Phone Screen" className="mt-1" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CalendarEventType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(CalendarEventType).map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 font-mono" />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 font-mono" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title || !date || !time || create.isPending}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
