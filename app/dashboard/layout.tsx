import { Sidebar } from "@/shared/layout/sidebar";
import { Header } from "@/shared/layout/header";  // Check path

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // 3. Just a DIV wrapper, no HTML/BODY tags
    <div className="flex h-screen overflow-hidden bg-muted/20 print:block print:h-auto print:overflow-visible print:bg-white">
      
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-background print:hidden md:block">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden print:block print:overflow-visible">
        <div className="print:hidden">
          <Header />
        </div>
        
        <main className="flex-1 overflow-y-auto p-8 print:block print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
