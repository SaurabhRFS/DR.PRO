import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  CalendarDays,
  DollarSign,
  UserPlus,
  ListChecks,
  FilePlus,
  LogOut,
  Building,
  Sun,
  Moon,
  Clock as ClockIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useTheme from "@/hooks/useTheme";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

// --- API Utility (Corrected) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = {
  // FIX: Used template literal (backticks ``) for string interpolation
  getAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/appointments`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },
  // FIX: Used template literal (backticks ``) for string interpolation
  getPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/patients`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },
};
// --- End API Utility ---

const DashboardPage = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile] = useLocalStorage("doctorProfile", {
    name: "Dr. Saurabh",
    avatarUrl: "",
  });
  const [greeting, setGreeting] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, patientsData] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [setAppointments, setPatients, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const todaysAppointments = appointments.filter(
    (app) =>
      app.date === today &&
      !["Done", "Cancelled", "Missed"].includes(app.status)
  );

  const todaysIncome = appointments
    .filter(
      (app) => app.date === today && app.status === "Done" && app.cost
    )
    .reduce((sum, app) => sum + parseFloat(app.cost), 0);

  const stats = [
    {
      title: "Total Patients",
      value: isLoading ? "..." : patients.length,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/50",
      link: "/patients",
    },
    {
      title: "Today's Appointments",
      value: isLoading ? "..." : todaysAppointments.length,
      icon: CalendarDays,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/50",
      link: "/appointments?filter=today",
    },
    {
      title: "Today's Income",
      // FIX: Used template literal (backticks ``) to format the currency
      value: isLoading ? "..." : `₹${todaysIncome.toFixed(2)}`,
      icon: DollarSign,
      color: "text-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/50",
      link: "/finance?filter=today",
    },
  ];

  // FIX: Corrected the quickLinks structure to be Tailwind-friendly.
  // Dynamic class concatenation is unreliable with Tailwind's build process.
  // It's better to define the full classes directly.
  const quickLinks = [
    {
      name: "Add New Patient",
      href: "/patients/new",
      icon: UserPlus,
      color: "text-primary",
      hoverClasses: "hover:border-primary hover:bg-primary/10",
    },
    {
      name: "View Appointments",
      href: "/appointments",
      icon: ListChecks,
      color: "text-green-600",
      hoverClasses: "hover:border-green-600 hover:bg-green-600/10",
    },
    {
      name: "View Calendar",
      href: "/finance?scrollTo=calendar",
      icon: CalendarDays,
      color: "text-blue-600",
      hoverClasses: "hover:border-blue-600 hover:bg-blue-600/10",
    },
    {
      name: "Add Expense",
      href: "/finance?action=addExpense",
      icon: FilePlus,
      color: "text-red-600",
      hoverClasses: "hover:border-red-600 hover:bg-red-600/10",
    },
  ];

  const getInitials = (name) => {
    if (!name) return "DS";
    const names = name.split(" ");
    if (names.length > 1) {
      return (
        names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase()
      );
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-4"
    >
      {/* Header with Avatar and Greeting */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Avatar className="h-12 w-12 cursor-pointer border-2 border-primary/50 shadow-md">
                  <AvatarImage
                    // FIX: Used template literal for the fallback URL
                    src={
                      doctorProfile.avatarUrl ||
                      `https://avatar.vercel.sh/${doctorProfile.name}.png?size=48`
                    }
                    alt={doctorProfile.name}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {getInitials(doctorProfile.name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 glassmorphic">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile-settings/profile")}>
                <Users className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile-settings/clinic")}>
                <Building className="mr-2 h-4 w-4" />
                <span>Clinic Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-500 focus:text-red-600 focus:bg-red-500/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {doctorProfile.name}
              </span>{" "}
              👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            {/* The theme toggle button was moved outside the main greeting div for better alignment */}
          </div>
        </div>
        <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="h-10 w-10"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <Card className="overflow-hidden hover:scale-105 transition-transform duration-300 ease-out hover:shadow-lg dark:bg-slate-800/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  {/* FIX: Used backticks for className */}
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <Card className="dark:bg-slate-800/70">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Access common tasks quickly.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link to={link.href} key={link.name}>
              <Button
                variant="outline"
                // FIX: Used the predefined hover classes from the link object
                className={`w-full justify-start py-5 text-left border-2 dark:border-slate-700 transition-colors duration-200 ${link.hoverClasses}`}
              >
                {/* FIX: Used backticks for className */}
                <link.icon className={`mr-3 h-5 w-5 ${link.color}`} />
                <div>
                  <p className="font-semibold text-foreground">{link.name}</p>
                </div>
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Appointments Preview */}
      <Card className="dark:bg-slate-800/70">
        <CardHeader>
          <CardTitle className="text-foreground">Upcoming Appointments</CardTitle>
          <CardDescription>A quick look at who is visiting soon.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 text-muted-foreground dark:text-slate-400"
            >
              <ClockIcon size={32} className="mx-auto mb-3 text-primary/70 dark:text-sky-400/70 animate-spin" />
              <p>Loading today's appointments...</p>
            </motion.div>
          ) : todaysAppointments.length > 0 ? (
            <ul className="space-y-3">
              {todaysAppointments.slice(0, 3).map((app, index) => {
                const patient = patients.find((p) => p.id === app.patientId);
                return (
                  <motion.li
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-secondary/50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {patient ? patient.name : "Unknown Patient"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {app.time ? `${app.time} - ` : ""}
                        {app.notes || "General Visit"}
                      </p>
                    </div>
                    {/* FIX: Used template literal for the `to` prop */}
                    <Link to={`/appointments?appointment_id=${app.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                      >
                        View
                      </Button>
                    </Link>
                  </motion.li>
                );
              })}
              {todaysAppointments.length > 3 && (
                <Link
                  to="/appointments?filter=today"
                  className="block text-center mt-3"
                >
                  <Button variant="link" className="text-primary">
                    View all {todaysAppointments.length} today's appointments
                  </Button>
                </Link>
              )}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No appointments scheduled for today yet.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardPage;