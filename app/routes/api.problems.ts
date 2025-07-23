export async function loader() {
  try {
    const url = new URL(
      "/api/problems",
      import.meta.env.VITE_API_BASE_URL ||
        "https://api.example.com"
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch problems" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error fetching problems:", e);
    // Return fallback data
    return new Response(
      JSON.stringify([
        {
          problemId: "123",
          name: "Default Problem",
          rating: 1500,
          course: { courseId: "123456", name: "Default Course" },
          type: ["Environment"],
        },
      ]),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
