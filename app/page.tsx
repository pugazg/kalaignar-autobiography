"use client";

import { useState } from "react";
import BackToTop from "@/components/BackToTop";
import Navbar from "@/components/Navbar";
import SearchDialog from "@/components/SearchDialog";
import ExecutiveSummary from "@/sections/ExecutiveSummary";
import Footer from "@/sections/Footer";
import Gallery from "@/sections/Gallery";
import Chronicle from "@/sections/Chronicle";
import Principles from "@/sections/Principles";
import Hero from "@/sections/Hero";
import Governance from "@/sections/Governance";
import AgainstTheWorld from "@/sections/AgainstTheWorld";
import Character from "@/sections/Character";
import RelationshipGraph from "@/sections/RelationshipGraph";
import DiscoverChapters from "@/sections/DiscoverChapters";
import Eelam from "@/sections/Eelam";
import SocialJustice from "@/sections/SocialJustice";
import Journey from "@/sections/Journey";
import People from "@/sections/People";
import Pillars from "@/sections/Pillars";
import Quotes from "@/sections/Quotes";
import References from "@/sections/References";
import Scholarship from "@/sections/Scholarship";
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
        <Chronicle />
        <Principles />
        <Pillars />
        <Timeline />
        <AgainstTheWorld />
        <Eelam />
        <Journey />
        <Themes />
        <DiscoverChapters />
        <Governance />
        <SocialJustice />
        <People />
        <RelationshipGraph />
        <Character />
        <Quotes />
        <StatsDashboard />
        <Gallery />
        <Scholarship />
        <References />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
