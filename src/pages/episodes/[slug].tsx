import { GetStaticPaths, GetStaticProps } from "next";
import { api } from "../../services/api";
import ptBR from "date-fns/locale/pt-BR";
import { convertDurationToTimeString } from "../../utils/convertDurationToTimeString";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "../../contexts/PlayerContext";
import Head from "next/head";

import styles from "./episode.module.scss";

type Episode = {
  id: string;
  text: string;
  members: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
  duration: number;
  durationAsString: string;
  url: string;
};

type EpisodeProps = {
  episode: Episode;
};

export default function Episode({ episode }: EpisodeProps) {
  const { play, disableShuffle } = usePlayer();

  function handlePlay() {
    play(episode);
    disableShuffle();
  }

  return (
    <div className={styles.episode}>
      <Head>
        <title>{episode.title} | Início</title>
      </Head>
      <div className={styles.thumbanailContainer}>
        <Link href="/">
          <button type="button">
            <img src="/arrow-left.svg" alt="Voltar" />
          </button>
        </Link>

        <Image
          src={episode.thumbnail}
          width={700}
          height={160}
          objectFit="cover"
        />
        <button onClick={handlePlay}>
          <img src="/play.svg" alt="Tocar" />
        </button>
      </div>

      <header>
        <h1>{episode.title}</h1>
        <span>{episode.members}</span>
        <span>{episode.publishedAt}</span>
        <span>{episode.durationAsString}</span>

        <div
          className={styles.description}
          dangerouslySetInnerHTML={{ __html: episode.description }}
        />
      </header>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get("episodes", {
    params: {
      _limit: 2,
      _sort: "published_at",
      _order: "desc",
    },
  });

  const paths = data.map((episode: Episode) => {
    return {
      params: {
        slug: episode.id,
      },
    };
  });

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { slug } = ctx.params;

  const { data } = await api.get(`/episodes/${slug}`);

  const episode = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    members: data.members,
    publishedAt: format(parseISO(data.published_at), "d MMM yy", {
      locale: ptBR,
    }),
    duration: Number(data.file.duration),
    durationAsString: convertDurationToTimeString(Number(data.file.duration)),
    description: data.description,
    url: data.file.url,
  };

  return {
    props: {
      episode,
    },
    revalidate: 60 * 60 * 24,
  };
};
