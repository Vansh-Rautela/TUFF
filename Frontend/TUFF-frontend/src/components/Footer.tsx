const Footer = () => {
  return (
    <footer className="bg-black py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-playfair font-bold mb-4 text-white">TUFF</h3>
            <p className="text-white leading-relaxed mb-4 max-w-md">
              Your Personal Fashion Assistant. Elevate your style with AI-powered recommendations 
              that understand your unique beauty and personality.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-white transition-smooth">Features</a></li>
              <li><a href="#pricing" className="text-white transition-smooth">Pricing</a></li>
              <li><a href="#faq" className="text-white transition-smooth">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white transition-smooth">Help Center</a></li>
              <li><a href="#" className="text-white transition-smooth">Contact Us</a></li>
              <li><a href="#" className="text-white transition-smooth">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-white">
            2024 TUFF. All rights reserved. Designed for style enthusiasts everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;