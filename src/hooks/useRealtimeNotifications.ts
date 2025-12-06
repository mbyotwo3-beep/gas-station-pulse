import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NotificationOptions {
  enableRideUpdates?: boolean;
  enableOrderUpdates?: boolean;
  enablePaymentRequests?: boolean;
}

export function useRealtimeNotifications(options: NotificationOptions = {}) {
  const { user } = useAuth();
  const {
    enableRideUpdates = true,
    enableOrderUpdates = true,
    enablePaymentRequests = true,
  } = options;

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `notification-${Date.now()}`,
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Ride updates subscription
    if (enableRideUpdates) {
      const rideChannel = supabase
        .channel("ride-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rides",
            filter: `passenger_id=eq.${user.id}`,
          },
          (payload) => {
            const ride = payload.new as any;
            const oldRide = payload.old as any;

            if (ride.status !== oldRide.status) {
              let message = "";
              switch (ride.status) {
                case "accepted":
                  message = "A driver has accepted your ride request!";
                  break;
                case "arriving":
                  message = "Your driver is arriving at the pickup location.";
                  break;
                case "in_progress":
                  message = "Your ride has started. Enjoy the trip!";
                  break;
                case "completed":
                  message = "Your ride is complete. Thanks for riding!";
                  break;
                case "cancelled":
                  message = "Your ride has been cancelled.";
                  break;
              }

              if (message) {
                toast.info(message);
                showBrowserNotification("Ride Update", message);
              }
            }
          }
        )
        .subscribe();

      channels.push(rideChannel);

      // Also subscribe as driver
      const driverRideChannel = supabase
        .channel("driver-ride-updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ride_requests",
            filter: `status=eq.pending`,
          },
          () => {
            toast.info("New ride request available!");
            showBrowserNotification("New Ride Request", "A passenger is looking for a ride nearby.");
          }
        )
        .subscribe();

      channels.push(driverRideChannel);
    }

    // Order updates subscription
    if (enableOrderUpdates) {
      const orderChannel = supabase
        .channel("order-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `customer_id=eq.${user.id}`,
          },
          (payload) => {
            const order = payload.new as any;
            const oldOrder = payload.old as any;

            if (order.status !== oldOrder.status) {
              let message = "";
              switch (order.status) {
                case "confirmed":
                  message = "Your order has been confirmed!";
                  break;
                case "preparing":
                  message = "Your order is being prepared.";
                  break;
                case "ready_for_pickup":
                  message = "Your order is ready for pickup!";
                  break;
                case "out_for_delivery":
                  message = "Your order is on the way!";
                  break;
                case "delivered":
                  message = "Your order has been delivered. Enjoy!";
                  break;
                case "cancelled":
                  message = "Your order has been cancelled.";
                  break;
              }

              if (message) {
                toast.info(message);
                showBrowserNotification("Order Update", message);
              }
            }
          }
        )
        .subscribe();

      channels.push(orderChannel);
    }

    // Payment requests subscription
    if (enablePaymentRequests) {
      const paymentChannel = supabase
        .channel("payment-request-updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "payment_requests",
            filter: `to_user_id=eq.${user.id}`,
          },
          (payload) => {
            const request = payload.new as any;
            const message = `You received a payment request for $${request.amount.toFixed(2)}`;
            toast.info(message);
            showBrowserNotification("Payment Request", message);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "payment_requests",
            filter: `from_user_id=eq.${user.id}`,
          },
          (payload) => {
            const request = payload.new as any;
            const oldRequest = payload.old as any;

            if (request.status !== oldRequest.status) {
              let message = "";
              switch (request.status) {
                case "accepted":
                  message = `Your payment request for $${request.amount.toFixed(2)} was accepted!`;
                  break;
                case "declined":
                  message = `Your payment request for $${request.amount.toFixed(2)} was declined.`;
                  break;
              }

              if (message) {
                toast.info(message);
                showBrowserNotification("Payment Request Update", message);
              }
            }
          }
        )
        .subscribe();

      channels.push(paymentChannel);
    }

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, enableRideUpdates, enableOrderUpdates, enablePaymentRequests, showBrowserNotification]);
}
