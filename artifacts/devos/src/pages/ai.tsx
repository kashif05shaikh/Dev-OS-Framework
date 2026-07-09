import { useListAiTools, useListPromptCategories, useListPrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt, useToggleFavoritePrompt, useUsePrompt, useCreatePromptCategory } from "@workspace/api-client-react";
import { Bot, Plus, Star, Copy, Hash, Code2, Sparkles, MessageSquare, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getListPromptsQueryKey, getListPromptCategoriesQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AiPage() {
  const { data: tools } = useListAiTools();
  const { data: categories } = useListPromptCategories();
  const [activeCategory, setActiveCategory] = useState<number | 'favorites' | null>(null);
  
  const { data: prompts } = useListPrompts(
    activeCategory === 'favorites' ? { favorite: true } : { categoryId: activeCategory || undefined },
    { query: { enabled: true } as any }
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI & Prompts
          </h1>
          <p className="text-muted-foreground mt-2">Tools directory and personal prompt vault.</p>
        </div>
      </div>

      {/* Tools quick links */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {tools?.map(tool => (
          <a key={tool.id} href={tool.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-sm hover:border-primary/50 transition-colors whitespace-nowrap group">
             <div className="h-2 w-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
             <span className="font-bold text-sm">{tool.name}</span>
             <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Categories Sidebar */}
        <div className="w-full lg:w-64 bg-card border border-border rounded-xl shadow-sm flex flex-col p-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
             <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Vault</span>
             <AddCategoryDialog />
          </div>

          <div className="flex flex-col gap-1">
             <button
               onClick={() => setActiveCategory(null)}
               className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left", activeCategory === null ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary text-foreground")}
             >
               <Bot className="h-4 w-4" /> All Prompts
             </button>
             <button
               onClick={() => setActiveCategory('favorites')}
               className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left text-yellow-600", activeCategory === 'favorites' ? "bg-yellow-500/10 border border-yellow-500/20" : "hover:bg-secondary")}
             >
               <Star className="h-4 w-4 fill-yellow-500" /> Favorites
             </button>
             
             <div className="h-px bg-border my-2" />
             
             {categories?.map(c => (
               <button
                 key={c.id}
                 onClick={() => setActiveCategory(c.id)}
                 className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left", activeCategory === c.id ? "bg-secondary border border-border shadow-sm" : "hover:bg-secondary/50 text-muted-foreground")}
               >
                 <Hash className="h-3.5 w-3.5" style={{ color: c.color }} /> {c.name}
               </button>
             ))}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/10 rounded-xl border border-border shadow-inner p-6">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {activeCategory === 'favorites' ? "Starred Prompts" : "Prompt Library"}
              </h2>
              <AddPromptDialog categories={categories || []} />
           </div>

           <ScrollArea className="flex-1">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-8">
               {prompts?.map(prompt => (
                 <PromptCard key={prompt.id} prompt={prompt} />
               ))}
               {prompts?.length === 0 && (
                 <div className="col-span-full py-16 text-center text-muted-foreground">
                   <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                   <p className="font-medium">No prompts found in this view.</p>
                 </div>
               )}
             </div>
           </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function PromptCard({ prompt }: { prompt: any }) {
  const qc = useQueryClient();
  const toggleFav = useToggleFavoritePrompt();
  const useP = useUsePrompt();
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    useP.mutate({ id: prompt.id }, {
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: getListPromptsQueryKey() });
         toast({ title: "Copied to clipboard", description: "Prompt usage logged." });
      }
    });
  };

  const handleFav = () => {
    toggleFav.mutate({ id: prompt.id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListPromptsQueryKey() })
    });
  };

  return (
    <Card className="bg-card border-border shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-border bg-secondary/30 flex flex-row items-start justify-between space-y-0">
         <div>
           <CardTitle className="text-base font-bold leading-tight mb-1">{prompt.title}</CardTitle>
           <div className="flex items-center gap-2">
             <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-1.5 py-0 bg-background">{prompt.tool || 'Any Tool'}</Badge>
             <span className="text-[10px] text-muted-foreground font-mono">Used {prompt.usageCount}x</span>
           </div>
         </div>
         <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-600 -mr-2 -mt-2" onClick={handleFav}>
           <Star className={cn("h-4 w-4", prompt.favorite ? "fill-current" : "")} />
         </Button>
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-1">
         <div className="bg-background border border-border rounded-md p-3 mb-4 flex-1 text-sm font-mono text-muted-foreground whitespace-pre-wrap overflow-hidden line-clamp-4 leading-relaxed">
           {prompt.content}
         </div>
         <Button className="w-full font-bold gap-2" variant="secondary" onClick={handleCopy}>
           <Copy className="h-4 w-4" /> Copy & Use
         </Button>
      </CardContent>
    </Card>
  );
}

function AddPromptDialog({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tool, setTool] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const qc = useQueryClient();
  const create = useCreatePrompt();

  const handleSave = () => {
    if(!title || !content) return;
    create.mutate({ data: { 
      title, 
      content, 
      tool: tool || undefined, 
      categoryId: categoryId !== "none" ? Number(categoryId) : undefined 
    }}, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPromptsQueryKey() });
        setOpen(false);
        setTitle("");
        setContent("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> New Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Save to Vault</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. React Component Generator" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Target Tool</Label>
              <Input value={tool} onChange={e => setTool(e.target.value)} placeholder="e.g. ChatGPT, Claude" className="mt-1" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Prompt Content</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} className="mt-1 min-h-[150px] font-mono text-sm" placeholder="Act as a senior..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title || !content || create.isPending}>Save Prompt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const create = useCreatePromptCategory();

  const handleSave = () => {
    if(!name) return;
    create.mutate({ data: { name, color: "#8b5cf6" } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPromptCategoriesQueryKey() });
        setOpen(false);
        setName("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3 w-3" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label>Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. System Design" className="mt-1" />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!name}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
