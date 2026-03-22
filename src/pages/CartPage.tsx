import { useState, useMemo } from "react";
import { notifyCustomerOrder, notifyCustomerBCoins } from "@/lib/notifications";
import { sendNotification } from "@/lib/notifications";
import { sendTelegramOrderNotify } from "@/lib/telegramNotify";