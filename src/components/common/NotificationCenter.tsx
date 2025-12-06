import { useState, useEffect } from "react";
import { Bell, Check, X, Car, Package, CreditCard, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "ride" | "order" | "payment" | "station";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "ride":
        return Car;
      case "order":
        return Package;
      case "payment":
        return CreditCard;
      case "station":
        return Fuel;
      default:
        return Bell;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time updates and add notifications
    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Ride updates
    const rideChannel = supabase
      .channel("notification-rides")
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
            const notification: Notification = {
              id: `ride-${ride.id}-${Date.now()}`,
              type: "ride",
              title: "Ride Update",
              message: getStatusMessage("ride", ride.status),
              read: false,
              createdAt: new Date(),
            };
            setNotifications((prev) => [notification, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    channels.push(rideChannel);

    // Payment requests
    const paymentChannel = supabase
      .channel("notification-payments")
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
          const notification: Notification = {
            id: `payment-${request.id}-${Date.now()}`,
            type: "payment",
            title: "Payment Request",
            message: `You received a payment request for $${request.amount.toFixed(2)}`,
            read: false,
            createdAt: new Date(),
          };
          setNotifications((prev) => [notification, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    channels.push(paymentChannel);

    // Order updates
    const orderChannel = supabase
      .channel("notification-orders")
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
            const notification: Notification = {
              id: `order-${order.id}-${Date.now()}`,
              type: "order",
              title: "Order Update",
              message: getStatusMessage("order", order.status),
              read: false,
              createdAt: new Date(),
            };
            setNotifications((prev) => [notification, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    channels.push(orderChannel);

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user]);

  const getStatusMessage = (type: "ride" | "order", status: string): string => {
    if (type === "ride") {
      switch (status) {
        case "accepted":
          return "A driver has accepted your ride!";
        case "arriving":
          return "Your driver is arriving.";
        case "in_progress":
          return "Your ride has started.";
        case "completed":
          return "Your ride is complete!";
        case "cancelled":
          return "Your ride was cancelled.";
        default:
          return `Ride status: ${status}`;
      }
    } else {
      switch (status) {
        case "confirmed":
          return "Your order has been confirmed!";
        case "preparing":
          return "Your order is being prepared.";
        case "ready_for_pickup":
          return "Order ready for pickup!";
        case "out_for_delivery":
          return "Your order is on the way!";
        case "delivered":
          return "Order delivered!";
        case "cancelled":
          return "Your order was cancelled.";
        default:
          return `Order status: ${status}`;
      }
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="w-10 h-10 rounded-xl relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer group",
                      notification.read
                        ? "bg-transparent hover:bg-muted/50"
                        : "bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        notification.read ? "bg-muted" : "bg-primary/10"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          notification.read
                            ? "text-muted-foreground"
                            : "text-primary"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          notification.read && "text-muted-foreground"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
