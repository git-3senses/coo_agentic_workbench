import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { LucideAngularModule, LayoutDashboard, Building2, Bot, Shield, ClipboardCheck, BarChart3, FileText, Settings, ChevronDown, ChevronRight, Gauge, FileCheck, Users, AlertTriangle, ArrowUpRight, Database, Lightbulb, Bell, ScrollText, BookOpen, Briefcase, ListTodo, TrendingUp, Layers, FolderOpen, Library, Scale, FileSearch, UserCog, Workflow, Link2, HelpCircle, Info, CheckCircle, Eye, Target, Activity, Search, Globe, Sidebar, Share2, CheckCircle2, Check, Loader2, Circle, TrendingDown, Clock, Home, Key, FlaskConical, Sparkles, Code2, Terminal, LifeBuoy, Radar, Hammer, Presentation, ArrowRight, PanelLeft, Headphones, ShieldAlert, Cpu, PenTool, PieChart, GraduationCap, FileStack, ClipboardList, Wrench, User, ChevronUp, UploadCloud, File, ScanSearch, ShieldCheck, History, BrainCircuit, RotateCcw, Send, MoreHorizontal, Pause, Plus, FileEdit, AlertCircle, Play, ArrowLeft, Maximize2, FileLineChart, FileBarChart2, MessageSquare, GitBranch, Crosshair, ListChecks, Save, Zap, Layout, Filter, LayoutTemplate, X, Download, GitMerge, LayoutGrid, Telescope, Gem, PlusCircle, List } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(),
    provideMarkdown(),
    importProvidersFrom(LucideAngularModule.pick({
      LayoutDashboard, Building2, Bot, Shield, ClipboardCheck, BarChart3, FileText, Settings, ChevronDown, ChevronRight, Gauge, FileCheck, Users, AlertTriangle, ArrowUpRight, Database, Lightbulb, Bell, ScrollText, BookOpen, Briefcase, ListTodo, TrendingUp, Layers, FolderOpen, Library, Scale, FileSearch, UserCog, Workflow, Link2, HelpCircle, Info, CheckCircle, Eye, Target, Activity, Search, Globe, Sidebar,
      Share2, CheckCircle2, Check, Loader2, Circle, TrendingDown, Clock,
      Home, Key, FlaskConical, Sparkles, Code2, Terminal, LifeBuoy, Radar, Hammer, Presentation, ArrowRight, PanelLeft,
      Headphones, ShieldAlert, Cpu, PenTool, PieChart, GraduationCap, FileStack, ClipboardList, Wrench,
      User, ChevronUp, UploadCloud, File, ScanSearch, ShieldCheck, History,
      BrainCircuit, RotateCcw, Send, MoreHorizontal, Pause, Plus, FileEdit, AlertCircle, Play,
      ArrowLeft, Maximize2, FileLineChart, FileBarChart2, MessageSquare, GitBranch, Crosshair, ListChecks, Save, Zap, Layout, Filter, LayoutTemplate, X,
      Download, GitMerge, LayoutGrid, Telescope, Gem, PlusCircle, List
    }))
  ]
};
