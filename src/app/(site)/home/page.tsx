'use client';

import { useLanguage } from '@/providers/language-provider';
import { FolderSlider } from '@/components/FolderSlider';
import { HomeIntroBlocks } from '@/components/HomeIntroBlocks';
import { YouTubeConsentEmbed } from '@/components/YoutubeConsentEmbed';

const HomePage = () => {
  const { t } = useLanguage();

  return (
    <div>
      <FolderSlider folder="HomeSlider" autoplay />

      <HomeIntroBlocks />

      <YouTubeConsentEmbed videoId="L1-oayFqB5o" title={t.homeVideoTitle} />
    </div>
  );
};

export default HomePage;
