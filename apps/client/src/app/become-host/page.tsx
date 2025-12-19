"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import {
  Building2,
  DollarSign,
  Calendar,
  Shield,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const BecomeHostPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role === "HOST") {
      router.push("/host");
    }
  }, [authLoading, user, router]);

  const handleBecomeHost = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/become-host");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/auth/become-host`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to become a host");
      }

      const data = await res.json();

      // Update the user in the store with new role
      if (data.user) {
        setUser(data.user);
      }

      setSuccess(true);

      // Redirect to host dashboard after a short delay
      setTimeout(() => {
        router.push("/host");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to FlexiSpace Hosting!
        </h1>
        <p className="text-gray-600 mb-6">
          Your host account has been activated. You can now list your spaces and
          start earning.
        </p>
        <p className="text-gray-500">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="">
      {/* Hero Section */}
      <section className="text-center py-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Share Your Space, Earn Extra Income
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Join thousands of hosts earning by renting out their unused spaces.
          From office desks to wedding venues, there&apos;s a space for everyone.
        </p>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleBecomeHost}
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Start Hosting
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {!isAuthenticated && (
          <p className="text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/login?redirect=/become-host" className="text-blue-600 hover:underline">
              Sign in
            </Link>{" "}
            to continue
          </p>
        )}
      </section>

      {/* Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Earn Extra Income</h3>
          <p className="text-gray-600 text-sm">
            Turn your unused space into a steady income stream. Set your own
            prices and availability.
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Flexible Schedule</h3>
          <p className="text-gray-600 text-sm">
            You&apos;re in control. Choose when your space is available and approve
            bookings that work for you.
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
          <p className="text-gray-600 text-sm">
            Get paid securely through our platform. Deposits are collected
            upfront to protect your space.
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Easy Management</h3>
          <p className="text-gray-600 text-sm">
            Our host dashboard makes it simple to manage listings, bookings, and
            communicate with guests.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Your Listing</h3>
            <p className="text-gray-600 text-sm">
              Add photos, set your pricing, and describe what makes your space
              special. It only takes a few minutes.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Accept Bookings</h3>
            <p className="text-gray-600 text-sm">
              Review booking requests from guests. Accept the ones that work for
              you and your schedule.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Paid</h3>
            <p className="text-gray-600 text-sm">
              Receive payments directly to your account. We handle all the
              payment processing for you.
            </p>
          </div>
        </div>
      </section>

      {/* Space Types */}
      <section className="bg-gray-50 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          What Can You Host?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { name: "Office Desks", emoji: "🖥️" },
            { name: "Private Offices", emoji: "🏢" },
            { name: "Meeting Rooms", emoji: "👥" },
            { name: "Event Venues", emoji: "🎉" },
            { name: "Wedding Venues", emoji: "💒" },
            { name: "Coworking Spaces", emoji: "🏠" },
          ].map((type) => (
            <div key={type.name} className="p-4 bg-white rounded-lg">
              <div className="text-3xl mb-2">{type.emoji}</div>
              <p className="text-sm font-medium text-gray-900">{type.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Start Hosting?
        </h2>
        <p className="text-gray-600 mb-6">
          Join FlexiSpace today and turn your space into an opportunity.
        </p>
        <button
          onClick={handleBecomeHost}
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Become a Host
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </section>
    </div>
  );
};

export default BecomeHostPage;
