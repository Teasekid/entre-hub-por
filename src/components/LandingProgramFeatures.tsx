
import React from "react";

const LandingProgramFeatures = () => (
  <div className="mt-16 text-center">
    <h3 className="text-2xl font-semibold text-amber-800 mb-8">
      Program Features
    </h3>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
        <h4 className="font-semibold text-amber-800 mb-2">Digital Marketing</h4>
        <p className="text-amber-600 text-sm">Learn modern digital marketing strategies and tools</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
        <h4 className="font-semibold text-amber-800 mb-2">Business Planning</h4>
        <p className="text-amber-600 text-sm">Develop comprehensive business plans and strategies</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
        <h4 className="font-semibold text-amber-800 mb-2">Financial Management</h4>
        <p className="text-amber-600 text-sm">Master financial planning and management skills</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
        <h4 className="font-semibold text-amber-800 mb-2">Leadership Skills</h4>
        <p className="text-amber-600 text-slim">Build essential leadership and management capabilities</p>
      </div>
    </div>
  </div>
);

export default LandingProgramFeatures;
