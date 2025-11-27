import React from "react";
import { Menu, Moon, Sun, Cloud, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useThemeStore } from "@/store/useThemeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSearchStore } from "@/store/useSearchStore";
import { THEME } from "@/constants";
import Sidebar from "./Sidebar";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchTerm = useSearchStore((state) => state.searchTerm);

  React.useEffect(() => {
    if (searchTerm && location.pathname !== "/files") {
      navigate("/files");
    }
  }, [searchTerm, location.pathname, navigate]);

  return (
    <header className="mx-auto w-[95%] max-w-7xl rounded-full glass-panel px-6 h-16 flex items-center justify-between transition-all duration-300 hover:border-cyan-500/20 hover:shadow-lg dark:hover:shadow-cyan-500/10 bg-white/80 dark:bg-black/40 border-white/40 dark:border-white/5 mt-4 flex-none">
      {/* Mobile Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="glass-panel border-r-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main Menu</SheetDescription>
          <Sidebar
            className="bg-transparent border-none"
            onItemClick={() => setIsOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Logo Area or Search Bar */}
      {user ? (
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            </div>
            <Input
              type="text"
              placeholder="Search files, folders..."
              className="pl-10 pr-4 h-10 w-full rounded-full bg-slate-100 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-cyan-500/50 transition-all duration-300"
              value={useSearchStore((state) => state.searchTerm)}
              onChange={(e) =>
                useSearchStore.getState().setSearchTerm(e.target.value)
              }
            />
          </div>
        </div>
      ) : (
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Cloud className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-heading font-bold text-xl tracking-wide text-slate-900 dark:text-white">
            Helio
            <span className="text-cyan-600 dark:text-cyan-400">Scape</span>
          </span>
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
        >
          {theme === THEME.LIGHT ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User Profile / Status (Replaces Login Button) */}
        {user ? (
          <Link
            to="/profile"
            className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10 group"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white leading-none group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {user.name || user.email?.split("@")[0]}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Online
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 p-[2px] group-hover:scale-105 transition-transform">
              <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                <User className="h-4 w-4 text-slate-900 dark:text-white" />
              </div>
            </div>
          </Link>
        ) : (
          <Link to="/login">
            <Button className="hidden sm:flex rounded-full bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 border border-transparent dark:border-white/10 backdrop-blur-md text-white font-medium px-6 transition-all hover:scale-105 shadow-lg">
              Login
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
