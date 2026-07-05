"use client";

import { useState } from "react";
import BackToTop from "@/components/BackToTop";
import Navbar from "@/components/Navbar";
import SearchDialog from "@/components/SearchDialog";
import ExecutiveSummary from "@/sections/ExecutiveSummary";
import Footer from "@/sections/Footer";
import Gallery from "@/sections/Gallery";
import Hero from "@/sections/Hero";
import Journey from "@/sections/Journey";
import People from "@/sections/People";
import Pillars from "@/sections/Pillars";
import Quotes from "@/sections/Quotes";
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
      <main id="main">
        <Hero />
        <ExecutiveSummary />
        <Pillars />
        <Timeline />
        <Journey />
        <Themes />
        <People />
        <Quotes />
        <StatsDashboard />
        <Gallery />
        <References />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
