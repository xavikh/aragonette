import React, { createContext, useState, useContext } from "react";
import { IAlert } from "@/utils/types";
import { usePublicClient } from "wagmi";

const DEFAULT_ALERT_TIMEOUT = 7 * 1000;

export type NewAlert = {
  type: "success" | "info" | "error";
  message: string;
  description?: string;
  txHash?: string;
  timeout?: number;
};

export interface AlertContextProps {
  alerts: IAlert[];
  addAlert: (newAlert: NewAlert) => void;
}

export const AlertContext = createContext<AlertContextProps | undefined>(
  undefined
);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const client = usePublicClient();

  // Add a new alert to the list
  const addAlert = (alert: NewAlert) => {
    const newAlert: IAlert = {
      id: Date.now(),
      message: alert.message,
      description: alert.description,
      type: alert.type,
    };
    if (alert.txHash && client) {
      newAlert.explorerLink =
        client.chain.blockExplorers?.default.url + "/tx/" + alert.txHash;
    }
    setAlerts(alerts.concat(newAlert));

    // Schedule the clean-up
    const timeout = alert.timeout ?? DEFAULT_ALERT_TIMEOUT;
    setTimeout(() => {
      removeAlert(newAlert.id);
    }, timeout);
  };

  // Function to remove an alert
  const removeAlert = (id: number) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, addAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlertContext = () => {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useContext must be used inside the AlertProvider");
  }

  return context;
};
