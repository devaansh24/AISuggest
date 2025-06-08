"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const createRoom = async () => {
    const { data } = await supabase
      .from("sessions")
      .insert({ title: "My Brainstorming Session" })
      .select()
      .single();

    if (data) {
      router.push(`/room/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-4">Team Brainstorming AI</h1>
        <p className="text-gray-600 mb-6">
          Start collaborating with your team in real-time
        </p>
        <button
          onClick={createRoom}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create New Room
        </button>
      </div>
    </div>
  );
}
