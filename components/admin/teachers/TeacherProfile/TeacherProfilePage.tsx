'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Award, GraduationCap, Edit, Trash2, Banknote } from 'lucide-react';

export default function TeacherProfilePage({ teacherId }: { teacherId: string }) {
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/teachers/${teacherId}`)
      .then(res => res.json())
      .then(data => {
        setTeacher(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [teacherId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!teacher || teacher.error) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Teacher Not Found</h3>
        <p className="text-slate-500 mt-2">The teacher profile you are looking for does not exist.</p>
        <Link href="/admin/teachers">
          <button type="button" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Back to Teachers
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/teachers">
            <button type="button" aria-label="Back to teachers" className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {teacher.firstName} {teacher.lastName}
              </h2>
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                teacher.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {teacher.status}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-sm">{teacher.teacherCode}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-medium text-sm">
            <Edit className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold mb-4 shadow-sm">
                {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{teacher.firstName} {teacher.lastName}</h2>
              <p className="text-primary font-medium mt-1">
                {teacher.subjects?.filter((s:any) => s.isPrimary)[0]?.subject?.name || 'Teacher'} Specialist
              </p>
            </div>
            
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className="text-sm">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Phone className="h-5 w-5 text-slate-400" />
                <span className="text-sm">{teacher.phone}</span>
              </div>
              {teacher.city && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <span className="text-sm">{teacher.city}{teacher.state ? `, ${teacher.state}` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subjects Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Assigned Subjects
            </h3>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects?.map((sub: any, idx: number) => (
                <span key={idx} className={`px-3 py-1.5 text-sm rounded-md font-medium ${sub.isPrimary ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                  {sub.subject.name} {sub.isPrimary && '★'}
                </span>
              ))}
              {(!teacher.subjects || teacher.subjects.length === 0) && (
                <p className="text-slate-500 text-sm">No subjects assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tabs/Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-lg">
              Employment Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Employment Type
                </p>
                <p className="font-medium text-slate-900 dark:text-white">{teacher.employmentType.replace('_', ' ')}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Salary Structure
                </p>
                <p className="font-medium text-slate-900 dark:text-white">{teacher.salaryType.replace('_', ' ')}</p>
                {teacher.salaryType === 'FIXED' && teacher.fixedSalary && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">₹{teacher.fixedSalary} / month</p>
                )}
                {teacher.salaryType === 'PER_CLASS' && teacher.perClassRate && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">₹{teacher.perClassRate} / class</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Joining Date
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : 'Not recorded'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Experience
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {teacher.experience !== null ? `${teacher.experience} Years` : 'Not recorded'}
                </p>
              </div>
            </div>
          </div>

          {/* Batches section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                Assigned Batches
              </h3>
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {teacher.batches?.length || 0} Batches
              </span>
            </div>
            
            {teacher.batches && teacher.batches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teacher.batches.map((batch: any) => (
                  <div key={batch.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">{batch.name}</h4>
                    <p className="text-xs font-mono text-slate-500 mt-1">{batch.code}</p>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {batch.subject?.name}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="h-3 w-3" /> {batch.currentStrength}/{batch.maxStrength}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">This teacher has no assigned batches yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Temporary icon to avoid new imports
function Users({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
