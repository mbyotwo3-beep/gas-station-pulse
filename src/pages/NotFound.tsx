import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePageSeo } from "@/lib/seo";

const NotFound = () => {
  const location = useLocation();

  usePageSeo({
    title: "Page not found (404) – FuelFinder",
    description: "The page you were looking for doesn't exist. Return to FuelFinder to find live fuel availability and rides near you.",
    path: location.pathname,
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="text-center">
        <h1 className="text-6xl font-bold mb-6 text-primary">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-primary/80 underline motion-smooth">
          Return to Home
        </a>
      </section>
    </main>
  );
};

export default NotFound;
