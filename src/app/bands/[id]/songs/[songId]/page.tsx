import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInstruments } from "@/lib/utils";
import { SongPracticePage } from "@/components/practice/song-practice-page";

interface SongPageProps {
  params: Promise<{
    id: string;
    songId: string;
  }>;
}

export default async function SongPage({ params }: SongPageProps) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user is a member of this band and get song details
  const membership = await db.bandMember.findUnique({
    where: {
      userId_bandId: {
        userId: session.user.id,
        bandId: resolvedParams.id
      }
    }
  });

  if (!membership) {
    notFound();
  }

  // Get song with annotations and comments
  const song = await db.song.findFirst({
    where: {
      id: resolvedParams.songId,
      bandId: resolvedParams.id
    },
    include: {
      band: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      },
      annotations: {
        include: {
          user: true,
          comments: {
            include: {
              user: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      }
    }
  });

  if (!song) {
    notFound();
  }

  // Get current user details with parsed instruments
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id }
  });

  if (!currentUser) {
    redirect("/auth/signin");
  }

  // Transform data to include parsed instruments
  const userInstruments = parseInstruments(currentUser.instruments);
  
  const annotationsWithInstruments = song.annotations.map(annotation => ({
    ...annotation,
    instruments: parseInstruments(annotation.instruments),
    user: {
      ...annotation.user,
      instruments: parseInstruments(annotation.user.instruments)
    },
    comments: annotation.comments.map(comment => ({
      ...comment,
      user: {
        ...comment.user,
        instruments: parseInstruments(comment.user.instruments)
      }
    }))
  }));

  // Get all unique instruments from band members
  const allBandInstruments = Array.from(
    new Set(
      song.band.members.flatMap(member => 
        parseInstruments(member.user.instruments)
      )
    )
  ).sort();

  const songWithInstruments = {
    ...song,
    annotations: annotationsWithInstruments
  };

  return (
    <SongPracticePage
      song={songWithInstruments}
      userInstruments={userInstruments}
      availableInstruments={allBandInstruments}
      bandId={resolvedParams.id}
    />
  );
}