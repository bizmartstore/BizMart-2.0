import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Home, Dumbbell, Swords, ShoppingBag, Heart, Zap,
  Trophy, Star, Coins, Shield, Sword, ChevronRight, Loader2,
  Sparkles, Skull, Crown, Gift
} from "lucide-react";

// Types
interface BizMonPet {
  id: string;
  name: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  health: number;
  max_health: number;
  hunger: number;
  happiness: number;
  last_fed: string | null;
  last_trained: string | null;
  total_battles: number;
  battles_won: number;
}

interface DailyLimits {
  battles_played: number;
  training_sessions: number;
  bcoins_earned: number;
}

interface BattleResult {
  result: "win" | "lose" | "draw";
  xp_gained: number;
  bcoins_gained: number;
}

type GameView = "map" | "home" | "training" | "arena" | "shop" | "battle";

const MAX_DAILY_BCOINS = 5;
const MAX_DAILY_BATTLES = 3;
const MAX_DAILY_TRAINING = 5;

const QUIZ_QUESTIONS = [
  { q: "What is 12 × 8?", options: ["96", "88", "104", "92"], correct: 0 },
  { q: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Mars", "Earth"], correct: 1 },
  { q: "What is the chemical symbol for water?", options: ["O2", "CO2", "H2O", "NaCl"], correct: 2 },
  { q: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Twain", "Austen"], correct: 1 },
  { q: "What is the square root of 144?", options: ["10", "11", "12", "13"], correct: 2 },
  { q: "Which gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2 },
  { q: "What is 15% of 200?", options: ["25", "30", "35", "20"], correct: 1 },
  { q: "Which continent is the largest?", options: ["Africa", "North America", "Asia", "Europe"], correct: 2 },
];

const SHOP_ITEMS = [
  { id: "food", name: "Pet Food", cost: 2, icon: "🍖", effect: "hunger", value: 30 },
  { id: "toy", name: "Toy", cost: 3, icon: "🧸", effect: "happiness", value: 25 },
  { id: "potion", name: "Health Potion", cost: 5, icon: "🧪", effect: "health", value: 50 },
];

const PET_EMOJIS = ["🐉", "🦊", "🐱", "🐶", "🦁", "🐼", "🐨", "🐯"];

export default function BizMonArena({ onBack }: { onBack: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [view, setView] = useState<GameView>("map");
  const [pet, setPet] = useState<BizMonPet | null>(null);
  const [dailyLimits, setDailyLimits] = useState<DailyLimits>({ battles_played: 0, training_sessions: 0, bcoins_earned: 0 });
  const [loading, setLoading] = useState(true);
  const [creatingPet, setCreatingPet] = useState(false);
  const [petName, setPetName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(0);

  // Training state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [trainingScore, setTrainingScore] = useState(0);
  const [trainingComplete, setTrainingComplete] = useState(false);

  // Battle state
  const [battleOpponent, setBattleOpponent] = useState<any>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [battleAnimating, setBattleAnimating] = useState(false);

  // Shop state
  const [buyingItem, setBuyingItem] = useState<string | null>(null);

  // Load pet and limits
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: petData } = await (supabase as any)
        .from("bizmon_pets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setPet(petData);

      const today = new Date().toISOString().split("T")[0];
      const { data: limitsData } = await (supabase as any)
        .from("bizmon_daily_limits")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      setDailyLimits(limitsData || { battles_played: 0, training_sessions: 0, bcoins_earned: 0 });
    } catch (e) {
      console.error("Failed to load BizMon data:", e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Create pet
  const createPet = async () => {
    if (!user || !petName.trim()) return;
    setCreatingPet(true);
    try {
      const { data, error } = await (supabase as any)
        .from("bizmon_pets")
        .insert({
          user_id: user.id,
          name: petName.trim(),
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          health: 100,
          max_health: 100,
          hunger: 100,
          happiness: 100,
        })
        .select()
        .single();
      if (error) throw error;
      setPet(data);
      toast({ title: "🎉 BizMon Created!", description: `Welcome ${petName}!` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setCreatingPet(false);
  };

  // Feed pet
  const feedPet = async () => {
    if (!pet) return;
    try {
      const newHunger = Math.min(100, pet.hunger + 20);
      const newHappiness = Math.min(100, pet.happiness + 5);
      await (supabase as any)
        .from("bizmon_pets")
        .update({ hunger: newHunger, happiness: newHappiness, last_fed: new Date().toISOString() })
        .eq("id", pet.id);
      setPet({ ...pet, hunger: newHunger, happiness: newHappiness });
      toast({ title: "🍖 Fed!", description: "Your BizMon is happier!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Training
  const startTraining = () => {
    if (dailyLimits.training_sessions >= MAX_DAILY_TRAINING) {
      toast({ title: "Limit Reached", description: "Come back tomorrow for more training!", variant: "destructive" });
      return;
    }
    setCurrentQuestion(0);
    setTrainingScore(0);
    setTrainingComplete(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setView("training");
  };

  const answerQuestion = async (answerIdx: number) => {
    setSelectedAnswer(answerIdx);
    setShowResult(true);
    const isCorrect = answerIdx === QUIZ_QUESTIONS[currentQuestion].correct;
    if (isCorrect) setTrainingScore(s => s + 1);

    setTimeout(async () => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(q => q + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Training complete
        setTrainingComplete(true);
        const xpGained = trainingScore * 10 + (isCorrect ? 10 : 0);
        const bcoinsGained = Math.min(1, MAX_DAILY_BCOINS - dailyLimits.bcoins_earned);

        if (pet) {
          const newXp = pet.xp + xpGained;
          const leveledUp = newXp >= pet.xp_to_next_level;
          const newLevel = leveledUp ? pet.level + 1 : pet.level;
          const newXpToNext = leveledUp ? pet.xp_to_next_level * 1.5 : pet.xp_to_next_level;
          const finalXp = leveledUp ? newXp - pet.xp_to_next_level : newXp;

          await (supabase as any)
            .from("bizmon_pets")
            .update({
              xp: finalXp,
              level: newLevel,
              xp_to_next_level: newXpToNext,
              last_trained: new Date().toISOString(),
            })
            .eq("id", pet.id);

          setPet({ ...pet, xp: finalXp, level: newLevel, xp_to_next_level: newXpToNext });
        }

        // Update daily limits
        const today = new Date().toISOString().split("T")[0];
        const { data: existingLimit } = await (supabase as any)
          .from("bizmon_daily_limits")
          .select("*")
          .eq("user_id", user?.id)
          .eq("date", today)
          .maybeSingle();

        if (existingLimit) {
          await (supabase as any)
            .from("bizmon_daily_limits")
            .update({
              training_sessions: dailyLimits.training_sessions + 1,
              bcoins_earned: dailyLimits.bcoins_earned + bcoinsGained,
            })
            .eq("id", existingLimit.id);
        } else {
          await (supabase as any)
            .from("bizmon_daily_limits")
            .insert({
              user_id: user?.id,
              date: today,
              training_sessions: 1,
              bcoins_earned: bcoinsGained,
            });
        }

        setDailyLimits(prev => ({
          ...prev,
          training_sessions: prev.training_sessions + 1,
          bcoins_earned: prev.bcoins_earned + bcoinsGained,
        }));

        if (bcoinsGained > 0) {
          await (supabase as any)
            .from("bcoins_wallets")
            .update({ balance: (Number(profile?.bcoins || 0) + bcoinsGained) })
            .eq("user_id", user?.id);
          refreshProfile();
        }

        toast({
          title: "🎓 Training Complete!",
          description: `+${xpGained} XP, +${bcoinsGained} BCoins!`,
        });
      }
    }, 1000);
  };

  // PvP Battle
  const startBattle = async () => {
    if (dailyLimits.battles_played >= MAX_DAILY_BATTLES) {
      toast({ title: "Limit Reached", description: "Max battles reached for today!", variant: "destructive" });
      return;
    }
    if (!pet) return;

    setBattleAnimating(true);
    setBattleResult(null);

    try {
      // Find random opponent
      const { data: opponents } = await (supabase as any)
        .from("bizmon_pets")
        .select("*")
        .neq("user_id", user?.id)
        .limit(10);

      if (!opponents || opponents.length === 0) {
        toast({ title: "No Opponents", description: "No other BizMons available to battle!" });
        setBattleAnimating(false);
        return;
      }

      const opponent = opponents[Math.floor(Math.random() * opponents.length)];
      setBattleOpponent(opponent);

      // Simulate battle
      setTimeout(async () => {
        const playerPower = pet.level * 10 + pet.health / 10;
        const opponentPower = opponent.level * 10 + opponent.health / 10;
        const playerRoll = playerPower * (0.8 + Math.random() * 0.4);
        const opponentRoll = opponentPower * (0.8 + Math.random() * 0.4);

        let result: "win" | "lose" | "draw";
        let xpGained = 0;
        let bcoinsGained = 0;

        if (playerRoll > opponentRoll) {
          result = "win";
          xpGained = 20 + Math.floor(Math.random() * 10);
          bcoinsGained = Math.min(2, MAX_DAILY_BCOINS - dailyLimits.bcoins_earned);
        } else if (playerRoll < opponentRoll) {
          result = "lose";
          xpGained = 5;
          bcoinsGained = 0;
        } else {
          result = "draw";
          xpGained = 10;
          bcoinsGained = 1;
        }

        const newHealth = Math.max(10, pet.health - (result === "lose" ? 20 : 5));
        const newXp = pet.xp + xpGained;
        const leveledUp = newXp >= pet.xp_to_next_level;
        const newLevel = leveledUp ? pet.level + 1 : pet.level;
        const newXpToNext = leveledUp ? pet.xp_to_next_level * 1.5 : pet.xp_to_next_level;
        const finalXp = leveledUp ? newXp - pet.xp_to_next_level : newXp;

        await (supabase as any)
          .from("bizmon_pets")
          .update({
            health: newHealth,
            xp: finalXp,
            level: newLevel,
            xp_to_next_level: newXpToNext,
            total_battles: pet.total_battles + 1,
            battles_won: pet.battles_won + (result === "win" ? 1 : 0),
          })
          .eq("id", pet.id);

        await (supabase as any)
          .from("bizmon_battles")
          .insert({
            challenger_id: user?.id,
            defender_id: opponent.user_id,
            challenger_pet_id: pet.id,
            defender_pet_id: opponent.id,
            result,
            xp_gained: xpGained,
            bcoins_gained: bcoinsGained,
          });

        // Update daily limits
        const today = new Date().toISOString().split("T")[0];
        const { data: existingLimit } = await (supabase as any)
          .from("bizmon_daily_limits")
          .select("*")
          .eq("user_id", user?.id)
          .eq("date", today)
          .maybeSingle();

        if (existingLimit) {
          await (supabase as any)
            .from("bizmon_daily_limits")
            .update({
              battles_played: dailyLimits.battles_played + 1,
              bcoins_earned: dailyLimits.bcoins_earned + bcoinsGained,
            })
            .eq("id", existingLimit.id);
        } else {
          await (supabase as any)
            .from("bizmon_daily_limits")
            .insert({
              user_id: user?.id,
              date: today,
              battles_played: 1,
              bcoins_earned: bcoinsGained,
            });
        }

        if (bcoinsGained > 0) {
          await (supabase as any)
            .from("bcoins_wallets")
            .update({ balance: (Number(profile?.bcoins || 0) + bcoinsGained) })
            .eq("user_id", user?.id);
          refreshProfile();
        }

        setPet({ ...pet, health: newHealth, xp: finalXp, level: newLevel, xp_to_next_level: newXpToNext, total_battles: pet.total_battles + 1, battles_won: pet.battles_won + (result === "win" ? 1 : 0) });
        setDailyLimits(prev => ({
          ...prev,
          battles_played: prev.battles_played + 1,
          bcoins_earned: prev.bcoins_earned + bcoinsGained,
        }));
        setBattleResult({ result, xp_gained: xpGained, bcoins_gained: bcoinsGained });
        setBattleAnimating(false);

        toast({
          title: result === "win" ? "🏆 Victory!" : result === "lose" ? "💀 Defeat" : "🤝 Draw",
          description: `+${xpGained} XP${bcoinsGained > 0 ? `, +${bcoinsGained} BCoins` : ""}`,
        });
      }, 2000);
    } catch (e: any) {
      toast({ title: "Battle Error", description: e.message, variant: "destructive" });
      setBattleAnimating(false);
    }
  };

  // Shop
  const buyItem = async (item: typeof SHOP_ITEMS[0]) => {
    if (!pet || !profile) return;
    if (Number(profile.bcoins) < item.cost) {
      toast({ title: "Insufficient BCoins", description: `You need ${item.cost} BCoins!`, variant: "destructive" });
      return;
    }
    setBuyingItem(item.id);
    try {
      const updates: any = {};
      if (item.effect === "hunger") updates.hunger = Math.min(100, pet.hunger + item.value);
      if (item.effect === "happiness") updates.happiness = Math.min(100, pet.happiness + item.value);
      if (item.effect === "health") updates.health = Math.min(pet.max_health, pet.health + item.value);

      await (supabase as any)
        .from("bizmon_pets")
        .update(updates)
        .eq("id", pet.id);

      await (supabase as any)
        .from("bcoins_wallets")
        .update({ balance: Number(profile.bcoins) - item.cost })
        .eq("user_id", user?.id);

      setPet({ ...pet, ...updates });
      refreshProfile();
      toast({ title: `${item.icon} Purchased!`, description: `${item.name} used on your BizMon!` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setBuyingItem(null);
  };

  // Pet creation screen
  if (!pet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4"
      >
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white mb-6">
          <ArrowLeft className="h-5 w-5" /> Back to BCoins
        </button>

        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-8xl mb-6"
          >
            {PET_EMOJIS[selectedEmoji]}
          </motion.div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Create Your BizMon</h1>
          <p className="text-white/60 mb-8">Choose a name and start your adventure!</p>

          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            {PET_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedEmoji(idx)}
                className={`text-4xl p-3 rounded-xl transition-all ${selectedEmoji === idx ? "bg-white/20 scale-110" : "bg-white/5 hover:bg-white/10"}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <Input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Enter BizMon name..."
            className="mb-4 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            maxLength={20}
          />

          <Button
            onClick={createPet}
            disabled={!petName.trim() || creatingPet}
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
          >
            {creatingPet ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create BizMon"}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Battle animation
  if (battleAnimating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 flex items-center justify-center p-4">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-8xl mb-4"
          >
            ⚔️
          </motion.div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Battle in Progress...</h2>
          <p className="text-white/60">{pet.name} vs {battleOpponent?.name}</p>
        </div>
      </div>
    );
  }

  // Battle result
  if (battleResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full text-center bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-8xl mb-4"
          >
            {battleResult.result === "win" ? "🏆" : battleResult.result === "lose" ? "💀" : "🤝"}
          </motion.div>
          <h2 className={`text-3xl font-extrabold mb-2 ${battleResult.result === "win" ? "text-yellow-400" : battleResult.result === "lose" ? "text-red-400" : "text-blue-400"}`}>
            {battleResult.result === "win" ? "Victory!" : battleResult.result === "lose" ? "Defeat" : "Draw"}
          </h2>
          <p className="text-white/60 mb-6">vs {battleOpponent?.name}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-extrabold text-yellow-400">+{battleResult.xp_gained}</p>
              <p className="text-xs text-white/60">XP Gained</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-extrabold text-yellow-400">+{battleResult.bcoins_gained}</p>
              <p className="text-xs text-white/60">BCoins</p>
            </div>
          </div>

          <Button
            onClick={() => { setBattleResult(null); setView("map"); }}
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
          >
            Continue
          </Button>
        </div>
      </motion.div>
    );
  }

  // Training view
  if (view === "training") {
    if (trainingComplete) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4"
        >
          <button onClick={() => setView("map")} className="flex items-center gap-2 text-white/70 hover:text-white mb-6">
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          <div className="max-w-md mx-auto text-center">
            <div className="text-8xl mb-6">🎓</div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Training Complete!</h2>
            <p className="text-white/60 mb-6">You answered {trainingScore}/{QUIZ_QUESTIONS.length} correctly</p>
            <Button onClick={() => setView("map")} className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold">
              Continue
            </Button>
          </div>
        </motion.div>
      );
    }

    const question = QUIZ_QUESTIONS[currentQuestion];
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4"
      >
        <button onClick={() => setView("map")} className="flex items-center gap-2 text-white/70 hover:text-white mb-6">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>

        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">Question {currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
            <span className="text-yellow-400 font-bold">Score: {trainingScore}</span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 mb-6">
            <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-6">{question.q}</h3>
            <div className="space-y-3">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !showResult && answerQuestion(idx)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                    showResult
                      ? idx === question.correct
                        ? "bg-green-500/30 border-2 border-green-400 text-green-300"
                        : idx === selectedAnswer
                          ? "bg-red-500/30 border-2 border-red-400 text-red-300"
                          : "bg-white/5 text-white/40"
                      : "bg-white/10 hover:bg-white/20 text-white border-2 border-transparent"
                  }`}
                >
                  {opt}
                  {showResult && idx === question.correct && " ✓"}
                  {showResult && idx === selectedAnswer && idx !== question.correct && " ✗"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Main game views
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowLeft className="h-5 w-5" /> Exit
        </button>
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-bold text-white">{profile?.bcoins || 0}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4"
          >
            {/* Pet Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl"
                >
                  {PET_EMOJIS[selectedEmoji]}
                </motion.div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{pet.name}</h2>
                  <p className="text-white/60">Level {pet.level} • {pet.battles_won}/{pet.total_battles} Wins</p>
                </div>
              </div>

              {/* XP Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>XP</span>
                  <span>{pet.xp}/{pet.xp_to_next_level}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all"
                    style={{ width: `${(pet.xp / pet.xp_to_next_level) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Heart className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{pet.health}</p>
                  <p className="text-[10px] text-white/60">Health</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{pet.hunger}</p>
                  <p className="text-[10px] text-white/60">Hunger</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Star className="h-5 w-5 text-pink-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{pet.happiness}</p>
                  <p className="text-[10px] text-white/60">Happy</p>
                </div>
              </div>
            </div>

            {/* Daily Limits */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6">
              <h3 className="text-sm font-bold text-white/80 mb-3">Daily Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Training</span>
                  <span className="text-white">{dailyLimits.training_sessions}/{MAX_DAILY_TRAINING}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${(dailyLimits.training_sessions / MAX_DAILY_TRAINING) * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Battles</span>
                  <span className="text-white">{dailyLimits.battles_played}/{MAX_DAILY_BATTLES}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(dailyLimits.battles_played / MAX_DAILY_BATTLES) * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">BCoins Earned</span>
                  <span className="text-yellow-400">{dailyLimits.bcoins_earned}/{MAX_DAILY_BCOINS}</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setView("home")}
                className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-left hover:scale-[0.98] transition-transform"
              >
                <Home className="h-6 w-6 text-white mb-2" />
                <p className="font-bold text-white">Home</p>
                <p className="text-xs text-white/60">Feed & Play</p>
              </button>
              <button
                onClick={startTraining}
                disabled={dailyLimits.training_sessions >= MAX_DAILY_TRAINING}
                className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-left hover:scale-[0.98] transition-transform disabled:opacity-50"
              >
                <Dumbbell className="h-6 w-6 text-white mb-2" />
                <p className="font-bold text-white">Train</p>
                <p className="text-xs text-white/60">Quiz & XP</p>
              </button>
              <button
                onClick={startBattle}
                disabled={dailyLimits.battles_played >= MAX_DAILY_BATTLES}
                className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-4 text-left hover:scale-[0.98] transition-transform disabled:opacity-50"
              >
                <Swords className="h-6 w-6 text-white mb-2" />
                <p className="font-bold text-white">Arena</p>
                <p className="text-xs text-white/60">PvP Battle</p>
              </button>
              <button
                onClick={() => setView("shop")}
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-left hover:scale-[0.98] transition-transform"
              >
                <ShoppingBag className="h-6 w-6 text-white mb-2" />
                <p className="font-bold text-white">Shop</p>
                <p className="text-xs text-white/60">Buy Items</p>
              </button>
            </div>
          </motion.div>
        )}

        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <button onClick={() => setView("map")} className="flex items-center gap-2 text-white/70 hover:text-white mb-6">
              <ArrowLeft className="h-5 w-5" /> Back to Map
            </button>

            <div className="text-center mb-8">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-4"
              >
                {PET_EMOJIS[selectedEmoji]}
              </motion.div>
              <h2 className="text-2xl font-extrabold text-white">{pet.name}</h2>
              <p className="text-white/60">Level {pet.level}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={feedPet}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold text-lg"
              >
                🍖 Feed (+20 Hunger)
              </Button>
              <Button
                onClick={() => {
                  const newHappy = Math.min(100, pet.happiness + 15);
                  (supabase as any).from("bizmon_pets").update({ happiness: newHappy }).eq("id", pet.id);
                  setPet({ ...pet, happiness: newHappy });
                  toast({ title: "🎉 Played!", description: "Your BizMon is happier!" });
                }}
                className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg"
              >
                🎮 Play (+15 Happiness)
              </Button>
              <Button
                onClick={() => {
                  const newHealth = Math.min(pet.max_health, pet.health + 10);
                  (supabase as any).from("bizmon_pets").update({ health: newHealth }).eq("id", pet.id);
                  setPet({ ...pet, health: newHealth });
                  toast({ title: "💤 Rested!", description: "Your BizMon recovered some health!" });
                }}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg"
              >
                💤 Rest (+10 Health)
              </Button>
            </div>
          </motion.div>
        )}

        {view === "shop" && (
          <motion.div
            key="shop"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <button onClick={() => setView("map")} className="flex items-center gap-2 text-white/70 hover:text-white mb-6">
              <ArrowLeft className="h-5 w-5" /> Back to Map
            </button>

            <h2 className="text-2xl font-extrabold text-white mb-6">Shop</h2>

            <div className="space-y-3">
              {SHOP_ITEMS.map((item) => (
                <div key={item.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{item.icon}</span>
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-xs text-white/60">+{item.value} {item.effect}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => buyItem(item)}
                    disabled={buyingItem === item.id || Number(profile?.bcoins || 0) < item.cost}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
                  >
                    {buyingItem === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `${item.cost} 🪙`}
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}