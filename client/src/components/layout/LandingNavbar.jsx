import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cloud, Moon, Sun, Menu } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
import { THEME } from "@/constants";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const LandingNavbar = ({ hideLinks = false }) => {
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-transparent">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Cloud className="h-5 w-5 text-white" />
          <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="font-heading font-bold text-xl tracking-wide text-foreground">
          Helio<span className="text-cyan-500">Scape</span>
        </span>
      </Link>

      {/* Desktop Nav */}
      {!hideLinks && (
        <nav className="hidden md:flex items-center gap-8">
          {["Features"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/10"
        >
          {theme === THEME.LIGHT ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <div className="hidden sm:flex items-center gap-3">
          {!isLoginPage && (
            <Link to="/login">
              <Button
                variant="ghost"
                className="rounded-full font-medium text-muted-foreground hover:text-foreground"
              >
                Login
              </Button>
            </Link>
          )}
          {!isRegisterPage && (
            <Link to="/register">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 shadow-lg shadow-primary/20">
                Get Started
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Access site navigation.</SheetDescription>
            <div className="flex flex-col gap-4 mt-8">
              {!isLoginPage && (
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    Login
                  </Button>
                </Link>
              )}
              {!isRegisterPage && (
                <Link to="/register" className="w-full">
                  <Button className="w-full justify-start">Get Started</Button>
                </Link>
              )}
              {!hideLinks && (
                <>
                  <div className="border-t my-2" />
                  {["Features"].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      className="text-sm font-medium py-2 hover:text-primary"
                    >
                      {item}
                    </a>
                  ))}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default LandingNavbar;
