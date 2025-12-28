import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { User, FileText, Upload, Search, Loader2, AlertCircle, CheckCircle2, BrainCircuit, ArrowRight, Zap, Star } from 'lucide-react';
import { useUser } from '@supabase/auth-helpers-react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM DOODLES & GRID ---
const DrawVariant = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } }
};

const FrameworkGrid = () => (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden h-full">
        <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1.5, ease: "easeInOut" }} className="w-px bg-[#0061FE]/20 absolute left-[40px] hidden md:block" />
        <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1.5, delay: 0.2, ease: "easeInOut" }} className="w-px bg-[#0061FE]/20 absolute left-[260px] hidden md:block" />
        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5, delay: 0.1, ease: "easeInOut" }} className="absolute top-[180px] left-0 h-px bg-[#0061FE]/10" />
    </div>
);

const SquiggleArrow = () => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="#C2E812" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M10,50 Q30,10 50,30 T55,10" variants={DrawVariant} initial="hidden" animate="visible" />
        <motion.path d="M45,5 L55,10 L50,20" variants={DrawVariant} initial="hidden" animate="visible" />
    </svg>
);

const ResumeAnalyzer = () => {
    const user = useUser();
    const navigate = useNavigate();
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeUrl, setResumeUrl] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [parsingStatus, setParsingStatus] = useState('');
    const [profileResumeUrl, setProfileResumeUrl] = useState(null);
    const [useProfileResume, setUseProfileResume] = useState(false);
    const [analysisMode, setAnalysisMode] = useState('jd'); // 'jd' or 'general'

    // Fetch user profile resume
    useEffect(() => {
        const fetchProfileResume = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('resume_url')
                    .eq('uid', user.id)
                    .single();
                if (data && data.resume_url) setProfileResumeUrl(data.resume_url);
            } catch (err) { console.error("Error fetching profile resume:", err); }
        };
        fetchProfileResume();
    }, [user]);

    // Configure pdf.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                setResumeFile(file);
                setResumeUrl(URL.createObjectURL(file));
                setAnalysisResult(null);
                setError(null);
            } else {
                setError('Please upload a PDF or an image file.');
            }
        }
    };

    const extractTextFromPdf = async (url) => {
        let worker = null;
        try {
            setParsingStatus('Initializing OCR worker...');
            worker = await Tesseract.createWorker('eng', 1, {
                logger: m => console.log(m)
            });

            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            const maxPages = Math.min(pdf.numPages, 5);

            for (let i = 1; i <= maxPages; i++) {
                setParsingStatus(`Processing page ${i} of ${pdf.numPages}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;

                const { data: { text } } = await worker.recognize(canvas.toDataURL('image/png'));
                fullText += text + '\n';
            }

            await worker.terminate();
            return fullText;
        } catch (err) {
            console.error('PDF extraction error:', err);
            if (worker) await worker.terminate();
            throw new Error(`Failed to extract text from PDF: ${err.message}`);
        }
    };

    const extractTextFromImage = async (url) => {
        try {
            setParsingStatus('Processing image...');
            const { data: { text } } = await Tesseract.recognize(
                url, 'eng', { logger: m => console.log(m) }
            );
            return text;
        } catch (err) {
            console.error('Image extraction error:', err);
            throw new Error('Failed to extract text from image.');
        }
    };

    const handleAnalyze = async () => {
        if ((!resumeFile && !useProfileResume)) { setError('Please provide a resume.'); return; }
        if (analysisMode === 'jd' && !jobDescription.trim()) { setError('Please provide a job description for JD Match mode.'); return; }
        if (!GEMINI_API_KEY) { setError('Gemini API Key is missing. Please check configuration.'); return; }

        setLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            let resumeText = '';
            if (useProfileResume) {
                if (resumeUrl.toLowerCase().endsWith('.png') || resumeUrl.toLowerCase().endsWith('.jpg') || resumeUrl.toLowerCase().endsWith('.jpeg')) {
                    resumeText = await extractTextFromImage(resumeUrl);
                } else {
                    resumeText = await extractTextFromPdf(resumeUrl);
                }
            } else if (resumeFile) {
                if (resumeFile.type === 'application/pdf') {
                    resumeText = await extractTextFromPdf(resumeUrl);
                } else {
                    resumeText = await extractTextFromImage(resumeUrl);
                }
            }

            setParsingStatus('Analyzing with AI...');
            let prompt = '';

            if (analysisMode === 'jd') {
                prompt = `
                    You are an expert ATS (Applicant Tracking System) and Career Coach.
                    Compare the following Resume text against the Job Description (JD).
                    
                    Resume Text:
                    ${resumeText}
                    
                    Job Description:
                    ${jobDescription}
                    
                    Provide a detailed analysis in strictly raw JSON format (no markdown code blocks, no explanation text).
                    Ensure all strings are properly escaped.
                    The JSON structure must be:
                    {
                      "matchPercentage": number (0-100),
                      "summary": "string (brief overview of fit)",
                      "strengths": "markdown string (bullet points)",
                      "weaknesses": "markdown string (missing skills/experience)",
                      "improvements": "markdown string (concrete suggestions to improve the resume for this JD)"
                    }
                `;
            } else {
                prompt = `
                    You are an expert Career Coach and Resume Reviewer.
                    Analyze the following Resume text to provide general feedback on how to improve it for a professional career.
                    
                    Resume Text:
                    ${resumeText}
                    
                    Provide a detailed analysis in strictly raw JSON format (no markdown code blocks, no explanation text).
                    Ensure all strings are properly escaped.
                    The JSON structure must be:
                    {
                      "matchPercentage": number (0-100, representing overall resume quality score),
                      "summary": "string (brief summary of the candidate's profile)",
                      "strengths": "markdown string (strong points of the resume)",
                      "weaknesses": "markdown string (formatting issues, missing sections, unclear descriptions)",
                      "improvements": "markdown string (actionable tips to make the resume stand out generally)"
                    }
                `;
            }

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error(`AI Analysis failed: ${response.statusText}`);

            const result = await response.json();
            const generatedText = result.candidates[0].content.parts[0].text;
            const cleanText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            const finalJson = jsonMatch ? jsonMatch[0] : cleanText;

            const parsedResult = JSON.parse(finalJson);
            setAnalysisResult(parsedResult);

        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Something went wrong during analysis.');
        } finally {
            setLoading(false);
            setParsingStatus('');
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F5F2] font-sans text-[#1E1E1E] relative overflow-hidden">

            {/* Grid Background */}
            <FrameworkGrid />

            {/* --- HERO SECTION --- */}
            <div className="bg-[#1E1E1E] text-white pt-24 pb-48 px-6 relative overflow-hidden border-b border-[#0061FE]/20">
                {/* Decorative Elements */}
                <motion.div className="absolute top-12 left-[10%] z-20 opacity-50" animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
                    <div className="w-16 h-16 border-4 border-[#C2E812] rounded-full"></div>
                </motion.div>

                <div className="w-full max-w-7xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
                            RESUME <br />
                            <span className="text-[#0061FE]">ANALYZER</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl font-bold">
                            Optimize your CV with AI. Beat the ATS. Get hired.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* --- CONTENT CONTAINER --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

                    {/* LEFT COLUMN: Controls */}
                    <div className="space-y-8">
                        {/* Mode Toggle */}
                        <div className="bg-white p-2 rounded-2xl border-[3px] border-[#1E1E1E] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex">
                            <button
                                onClick={() => setAnalysisMode('jd')}
                                className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all ${analysisMode === 'jd'
                                    ? 'bg-[#1E1E1E] text-white shadow-md'
                                    : 'text-gray-500 hover:text-[#1E1E1E] hover:bg-gray-100'
                                    }`}
                            >
                                JD Match
                            </button>
                            <button
                                onClick={() => setAnalysisMode('general')}
                                className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all ${analysisMode === 'general'
                                    ? 'bg-[#0061FE] text-white shadow-md'
                                    : 'text-gray-500 hover:text-[#1E1E1E] hover:bg-gray-100'
                                    }`}
                            >
                                General Review
                            </button>
                        </div>

                        {/* Upload Card */}
                        <div className="bg-white p-8 rounded-[2rem] border-[3px] border-[#1E1E1E] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-[#C2E812] rounded-xl border-2 border-black">
                                    <Upload className="w-6 h-6 text-black" />
                                </div>
                                <h3 className="text-2xl font-black text-[#1E1E1E]">Upload Resume</h3>
                            </div>

                            <div className="border-[3px] border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#0061FE] hover:bg-blue-50/50 transition-all cursor-pointer relative group">
                                <input
                                    type="file"
                                    id="resume-upload"
                                    className="hidden"
                                    accept=".pdf,image/*"
                                    onChange={(e) => {
                                        setUseProfileResume(false);
                                        handleFileChange(e);
                                    }}
                                />
                                <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border-2 border-gray-100 group-hover:scale-110 transition-transform shadow-sm">
                                        <FileText className="w-8 h-8 text-[#0061FE]" />
                                    </div>
                                    <span className="text-lg font-bold text-[#1E1E1E] mb-1">Click to upload PDF or Image</span>
                                    <span className="text-sm text-gray-400 font-medium">Supports formatted resumes</span>
                                </label>
                            </div>

                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t-2 border-dashed border-gray-200"></div>
                                </div>
                                <span className="relative z-10 bg-white px-3 text-sm font-bold text-gray-400 uppercase tracking-widest">OR</span>
                            </div>

                            <button
                                onClick={() => {
                                    if (profileResumeUrl) {
                                        setUseProfileResume(true);
                                        setResumeFile(null);
                                        setResumeUrl(profileResumeUrl);
                                        setAnalysisResult(null);
                                        setError(null);
                                        toast.success("Using profile resume!");
                                    } else {
                                        toast.error("No resume found in profile");
                                    }
                                }}
                                className={`w-full py-4 rounded-xl border-[3px] font-black text-lg transition-all flex items-center justify-center gap-3 ${useProfileResume
                                    ? 'border-[#0061FE] bg-blue-50 text-[#0061FE]'
                                    : 'border-[#1E1E1E] text-[#1E1E1E] hover:bg-gray-50'
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                {useProfileResume ? 'Using Profile Resume' : 'Use Profile Resume'}
                            </button>

                            {resumeFile && !useProfileResume && (
                                <div className="mt-4 flex items-center gap-3 text-sm font-bold text-green-700 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="truncate">{resumeFile.name}</span>
                                </div>
                            )}
                        </div>

                        {/* JD Match Input */}
                        <AnimatePresence>
                            {analysisMode === 'jd' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white p-8 rounded-[2rem] border-[3px] border-[#1E1E1E] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-[#FF5018] rounded-xl border-2 border-black">
                                            <Zap className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[#1E1E1E]">Job Description</h3>
                                    </div>
                                    <textarea
                                        className="w-full h-64 p-6 border-[2px] border-gray-200 rounded-xl focus:border-[#0061FE] focus:ring-4 focus:ring-blue-500/10 text-base font-medium resize-none outline-none transition-all placeholder:text-gray-400 bg-gray-50"
                                        placeholder="Paste the job description here to compare..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl text-white font-black text-xl shadow-[8px_8px_0px_0px_black] transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_black] active:translate-y-0 active:shadow-[4px_4px_0px_0px_black] border-[3px] border-black ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#1E1E1E] hover:bg-[#0061FE]'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    {parsingStatus || 'CRUNCHING DATA...'}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3 tracking-wide">
                                    <BrainCircuit className="w-6 h-6" />
                                    {analysisMode === 'jd' ? 'ANALYZE MATCH' : 'GET FEEDBACK'}
                                </div>
                            )}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-100/50 text-red-600 rounded-xl border-2 border-red-200 font-bold flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Results */}
                    <div className="h-full">
                        {analysisResult ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[2rem] border-[3px] border-[#1E1E1E] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden sticky top-8"
                            >
                                <div className="bg-[#1E1E1E] p-10 text-center text-white relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
                                    <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-[6px] border-[#C2E812] bg-[#1E1E1E] mb-6 relative shadow-xl z-10">
                                        <span className="text-5xl font-black">{analysisResult.matchPercentage}%</span>
                                        <span className={`absolute -bottom-4 px-4 py-1.5 rounded-lg text-[#1E1E1E] font-black tracking-widest text-xs border-2 border-black ${analysisMode === 'jd' ? 'bg-[#C2E812]' : 'bg-[#0061FE] text-white'
                                            }`}>
                                            {analysisMode === 'jd' ? 'MATCH' : 'SCORE'}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black mb-3 tracking-tight">Analysis Complete</h2>
                                    <p className="text-gray-400 font-medium leading-relaxed max-w-lg mx-auto">{analysisResult.summary}</p>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Strengths */}
                                    <div className='p-6 bg-green-50 rounded-2xl border-2 border-green-100'>
                                        <h3 className="text-xl font-black text-green-800 mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-6 h-6" />
                                            Key Strengths
                                        </h3>
                                        <div className="prose prose-sm prose-green font-medium">
                                            <ReactMarkdown>{analysisResult.strengths}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Weaknesses */}
                                    <div className='p-6 bg-red-50 rounded-2xl border-2 border-red-100'>
                                        <h3 className="text-xl font-black text-red-800 mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-6 h-6" />
                                            Areas for Improvement
                                        </h3>
                                        <div className="prose prose-sm prose-red font-medium">
                                            <ReactMarkdown>{analysisResult.weaknesses}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Action Plan */}
                                    <div className='p-6 bg-blue-50 rounded-2xl border-2 border-blue-100'>
                                        <h3 className="text-xl font-black text-blue-800 mb-4 flex items-center gap-2">
                                            <ArrowRight className="w-6 h-6" />
                                            Action Plan
                                        </h3>
                                        <div className="prose prose-sm prose-blue font-medium">
                                            <ReactMarkdown>{analysisResult.improvements}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2rem] border-[3px] border-dashed border-gray-300 min-h-[600px] opacity-70">
                                <div className="absolute top-10 right-10 opacity-30">
                                    <SquiggleArrow />
                                </div>

                                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 border-[3px] border-gray-200">
                                    <BrainCircuit className="w-16 h-16 text-gray-300" />
                                </div>
                                <h3 className="text-3xl font-black text-[#1E1E1E] mb-4">Ready when you are</h3>
                                <p className="text-xl text-gray-500 max-w-sm font-medium">
                                    Upload your resume and get instant, AI-powered career feedback.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#1E1E1E', color: '#fff', border: '2px solid #333' } }} />
        </div>
    );
};

export default ResumeAnalyzer;
