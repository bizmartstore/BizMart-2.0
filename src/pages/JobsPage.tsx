import { useNavigate, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
// @ts-ignore
import { TopBar, BottomNav, Button, Plus, X, Search, Badge, Timer, MapPin, Star, Award, BookOpen, Briefcase, MessageCircle, Users, ArrowRight, AlertCircle } from "@/components/ui";
// @ts-ignore
import { categories } from "@/data/products";