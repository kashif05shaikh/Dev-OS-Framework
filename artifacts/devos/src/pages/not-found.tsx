import { Terminal } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground selection:bg-primary/20 p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="h-20 w-20 bg-secondary/50 rounded-2xl border border-border flex items-center justify-center mb-6 shadow-sm">
          <Terminal className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter mb-2 font-mono">404</h1>
        <div className="h-1 w-12 bg-primary mx-auto mb-6 rounded-full" />
        
        <h2 className="text-xl font-bold mb-4">Command Not Found</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The quadrant you are trying to access does not exist in the current system registry. 
          Return to the command deck to continue operations.
        </p>
        
        <Link href="/">
          <Button size="lg" className="font-bold shadow-md">
            Return to Base
          </Button>
        </Link>
      </div>
    </div>
  );
}
