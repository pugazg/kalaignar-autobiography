"use client";

import { useState } from "react";
import BackToTop from "@/components/BackToTop";
import Navbar from "@/components/Navbar";
import SearchDialog from "@/components/SearchDialog";
import ExecutiveSummary from "@/sections/ExecutiveSummary";
import Footer from "@/sections/Footer";
import Gallery from "@/sections/Gallery";
import Hero from "@/sections/Hero";
import Pillars from "@/sections/Pillars";
import References from "@/sections/References";
import StatsDashboard from "@/sections/StatsDashboard";
import Themes from "@/sections/Themes";
import Timeline from "@/sections/Timeline";

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <Navbar onSearch={() => setSearchOpen(true)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <main>
        <Hero />
        <ExecutiveSummary />
        <Pillars />
        <Timeline />
        <Themes />
        <StatsDashboard />
        <Gallery />
        <References />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
