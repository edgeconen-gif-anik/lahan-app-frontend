import { Sidebar } from "@/shared/layout/sidebar";
import { Header } from "@/shared/layout/header";  // Check path

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // 3. Just a DIV wrapper, no HTML/BODY tags
    <div className="flex h-screen overflow-hidden bg-muted/20">
      
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-background md:block">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}