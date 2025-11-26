import React from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useThemeStore } from "@/store/useThemeStore";
import { THEME } from "@/constants";
import Sidebar from "./Sidebar";

const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0">
          <Sidebar className="border-r-0" />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 items-center justify-end gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === THEME.LIGHT ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle Theme</span>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
