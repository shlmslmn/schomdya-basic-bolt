import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface MediaItem {
  title: string;
  description: string;
  type: 'music-video' | 'movie' | 'audio-music' | 'blog' | 'gallery' | 'resource';
  category: string;
  thumbnail_url: string;
  duration?: string;
  read_time?: string;
  is_premium: boolean;
  price?: number;
  rating?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    // Create a service role client
    const createClient = async () => {
      const { createClient: create } = await import("npm:@supabase/supabase-js@2.57.4");
      return create(supabaseUrl, supabaseServiceKey);
    };

    const supabase = await createClient();

    // Get or create sample creator profile
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No profiles found. Please create a user first." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const creatorId = profiles[0].id;

    const mediaItems: MediaItem[] = [
      // Stream content
      {
        title: "Unstoppable - Official Music Video",
        description: "An inspiring music video showcasing talent and creativity",
        type: "music-video",
        category: "music-video",
        thumbnail_url: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400",
        duration: "4:15",
        is_premium: false,
      },
      {
        title: "The Last Stand - Short Film",
        description: "A powerful short film exploring human resilience",
        type: "movie",
        category: "movie",
        thumbnail_url: "https://images.pexels.com/photos/269140/pexels-photo-269140.jpeg?auto=compress&cs=tinysrgb&w=400",
        duration: "12:30",
        is_premium: true,
      },
      // Listen content
      {
        title: "Sunset Groove",
        description: "Electronic music to relax and unwind",
        type: "audio-music",
        category: "electronic",
        thumbnail_url: "https://images.pexels.com/photos/417273/pexels-photo-417273.jpeg?auto=compress&cs=tinysrgb&w=400",
        duration: "3:45",
        is_premium: false,
      },
      {
        title: "Acoustic Soul",
        description: "Beautiful acoustic melodies for your day",
        type: "audio-music",
        category: "acoustic",
        thumbnail_url: "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=400",
        duration: "2:50",
        is_premium: false,
      },
      // Blog content
      {
        title: "Interview with Legends",
        description: "Exclusive insights from industry leaders",
        type: "blog",
        category: "branding",
        thumbnail_url: "https://images.pexels.com/photos/6953768/pexels-photo-6953768.jpeg?auto=compress&cs=tinysrgb&w=400",
        read_time: "5 min read",
        is_premium: false,
      },
      // Gallery content
      {
        title: "Brand Manual & Presets",
        description: "Professional branding resources",
        type: "gallery",
        category: "design",
        thumbnail_url: "https://images.pexels.com/photos/5554667/pexels-photo-5554667.jpeg?auto=compress&cs=tinysrgb&w=400",
        is_premium: false,
      },
      {
        title: "Portrait Photography Collection",
        description: "Stunning portrait photography showcase",
        type: "gallery",
        category: "photography",
        thumbnail_url: "https://images.pexels.com/photos/4027606/pexels-photo-4027606.jpeg?auto=compress&cs=tinysrgb&w=400",
        is_premium: true,
      },
      // Resources
      {
        title: "Social Media Templates Pack",
        description: "Ready-to-use templates for social media content",
        type: "resource",
        category: "templates",
        thumbnail_url: "https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=400",
        price: 115000,
        rating: 4.8,
        is_premium: false,
      },
      {
        title: "Producer's Key Sound Kit",
        description: "Professional sound kit for music production",
        type: "resource",
        category: "sound-kit",
        thumbnail_url: "https://images.pexels.com/photos/3990842/pexels-photo-3990842.jpeg?auto=compress&cs=tinysrgb&w=400",
        price: 190000,
        rating: 4.9,
        is_premium: false,
      },
      {
        title: "Freelancer's Guide to Contracts",
        description: "Essential guide for freelance professionals",
        type: "resource",
        category: "templates",
        thumbnail_url: "https://images.pexels.com/photos/8428076/pexels-photo-8428076.jpeg?auto=compress&cs=tinysrgb&w=400",
        price: 95000,
        rating: 4.7,
        is_premium: false,
      },
    ];

    const { data, error } = await supabase
      .from("media")
      .insert(
        mediaItems.map((item) => ({
          creator_id: creatorId,
          ...item,
        }))
      )
      .select();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${data?.length || 0} media items`,
        data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});