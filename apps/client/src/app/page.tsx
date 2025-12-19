import SpaceList from "@/components/SpaceList";
import Image from "next/image";
import Link from "next/link";
import { Search, Building2, Users, Calendar, Shield } from "lucide-react";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string }>;
}) => {
  const { type, city } = await searchParams;

  return (
    <div className="">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20 px-6 rounded-2xl mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Workspace
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Discover and book unique spaces for work, meetings, events, and more.
            From cozy coworking spots to grand wedding venues.
          </p>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5" />
            Explore Spaces
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Diverse Spaces</h3>
            <p className="text-sm text-gray-600 mt-1">
              From desks to venues, find exactly what you need
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Flexible Booking</h3>
            <p className="text-sm text-gray-600 mt-1">
              Book by the hour or day, whatever suits you
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Verified Hosts</h3>
            <p className="text-sm text-gray-600 mt-1">
              All spaces reviewed by our team for quality
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Secure Payments</h3>
            <p className="text-sm text-gray-600 mt-1">
              Pay securely with deposit protection
            </p>
          </div>
        </div>
      </section>

      {/* Featured Spaces */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Spaces</h2>
            <p className="text-gray-600 mt-1">
              Discover our most popular workspaces and venues
            </p>
          </div>
        </div>
        <SpaceList type={type} city={city} variant="homepage" />
      </section>

      {/* Become a Host CTA */}
      <section className="bg-gray-900 text-white py-12 px-8 rounded-2xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Have a Space to Share?
        </h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Join thousands of hosts earning income from their unused spaces.
          List your office, meeting room, or venue and start earning today.
        </p>
        <Link
          href="/become-host"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          Become a Host
        </Link>
      </section>
    </div>
  );
};

export default Homepage;
