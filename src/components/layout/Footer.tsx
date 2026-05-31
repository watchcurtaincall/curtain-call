import Link from "next/link";
import { PushNotificationToggle } from "@/components/shared/PushNotificationToggle";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="inline-block mb-4">
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              CURTAIN CALL
            </span>
          </Link>
          <p className="text-zinc-400 text-sm max-w-sm">
            The definitive digital home for theatre culture in Africa. Discover productions, read verified reviews, and explore artist stageographies.
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              <Link href="/discovery" className="hover:text-white transition-colors">Browse Shows</Link>
            </li>
            <li>
              <Link href="/artists" className="hover:text-white transition-colors">Artist Directory</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-zinc-400 mb-6">
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/critic-policy" className="hover:text-white transition-colors">Critic Verification Policy</Link>
            </li>
          </ul>
          <div className="mt-4">
            <h4 className="text-white font-medium mb-3 text-sm">Notifications</h4>
            <PushNotificationToggle />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Curtain Call. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Designed for Lagos. Built for the World.</p>
      </div>
    </footer>
  );
}
