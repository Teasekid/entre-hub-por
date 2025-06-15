
import React from "react";

const LandingHeader = () => (
  <div className="text-center mb-12">
    <div className="flex justify-center mb-6">
      <img 
        src="/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png" 
        alt="Federal University of Lafia Logo" 
        className="h-24 w-24"
      />
    </div>
    <h1 className="text-4xl font-bold text-amber-800 mb-4">
      Federal University of Lafia
    </h1>
    <h2 className="text-2xl font-semibold text-amber-700 mb-2">
      Entrepreneurship Skills Program (ESP)
    </h2>
    <p className="text-amber-600 text-lg max-w-2xl mx-auto">
      Empowering students with essential entrepreneurial skills for the future. 
      Register for our comprehensive training programs and unlock your potential.
    </p>
  </div>
);

export default LandingHeader;
