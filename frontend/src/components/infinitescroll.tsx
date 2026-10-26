import girlMain from "../assets/girl-main.jpg";
import yellowgirl1 from "@/assets/yellowgirl1.jpg";
import yellowgirl2 from "@/assets/yellowgirl2.jpg";

const Testimonials = () => {
  const scrollImages = [yellowgirl1, yellowgirl2, yellowgirl1, yellowgirl2];
  const infiniteImages = [...scrollImages, ...scrollImages];

  return (
    <section className="bg-black py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Tagline and main image */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16">
          <div className="md:w-1/2 text-left mb-10 md:mb-0">
            <div className="mb-4">
              <div className="text-white text-5xl md:text-6xl font-playfair font-extrabold leading-tight mb-2">
                <div>Find it.</div>
                <div>Snap it.</div>
                <div>Style it.</div>
              </div>
              <p className="text-neutral-300 text-base md:text-lg max-w-md">
                Loved a look? Just upload a photo or screenshot, and Alle instantly finds matching pieces — from exact matches to budget-friendly dupes — so you can shop your style, your way.
              </p>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <img
              src={girlMain}
              alt="Fashion Look"
              className="rounded-2xl object-cover w-full max-w-md shadow-lg"
            />
          </div>
        </div>

        {/* Infinite scrolling image rows */}
        <div className="space-y-10">
          {/* Top row (left to right) */}
          <div className="overflow-hidden w-full">
            <div className="flex gap-4 animate-marquee-left-to-right min-w-[200vw]">
              {[...infiniteImages, ...infiniteImages].map((img, i) => (
                <img
                  key={`top-${i}`}
                  src={img}
                  alt={`Look ${i}`}
                  className="w-48 h-64 object-cover rounded-xl border border-neutral-800"
                />
              ))}
            </div>
          </div>

          {/* Bottom row (right to left) */}
          <div className="overflow-hidden w-full">
            <div className="flex gap-4 animate-marquee-right-to-left min-w-[200vw]">
              {[...infiniteImages, ...infiniteImages].map((img, i) => (
                <img
                  key={`bottom-${i}`}
                  src={img}
                  alt={`Look ${i}`}
                  className="w-48 h-64 object-cover rounded-xl border border-neutral-800"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
