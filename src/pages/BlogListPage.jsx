import React, { useState, useEffect } from 'react';
import {
    Loader2, Search, BookOpen, PenTool,
    ThumbsUp, Sparkles, AlertTriangle, FileArchive,
    Camera, Droplets, CreditCard, HardDrive,
    Key, FileText, Pin, Printer, Rocket,
    Snail, Stamp, Tent, Upload, Folder,
    Trophy, Network, ZoomIn, Activity, AudioWaveform
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import { motion } from 'framer-motion';

// --- CUSTOM ANIMATED VISUALS (Match Dashboard) ---

// The "Framework" Dots Animation (Profile Background)
const FrameworkNodes = () => (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <motion.div
            className="absolute top-1/4 left-10 w-4 h-4 bg-[#2B2929] rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
            className="absolute bottom-1/4 right-10 w-4 h-4 bg-[#2B2929] rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, delay: 1, repeat: Infinity }}
        />
        <svg className="absolute inset-0 w-full h-full">
            <line x1="40" y1="25%" x2="calc(100% - 40px)" y2="75%" stroke="#2B2929" strokeWidth="2" />
        </svg>
    </div>
);

// Vertical Icon Sidebar Component
// Vertical Icon Sidebar Component - Animated Marquee
const IconSidebar = () => {
    const iconSet = [
        ThumbsUp, Sparkles, AlertTriangle, FileArchive,
        Camera, Droplets, CreditCard, HardDrive,
        Key, FileText, Pin, Printer, Rocket,
        Snail, Stamp, Tent, Upload, Folder,
        Trophy, Network, ZoomIn, Activity, AudioWaveform
    ];

    // Triple the list for smoother seamless loop
    const icons = [...iconSet, ...iconSet, ...iconSet];

    return (
        <div className="hidden xl:flex flex-col border-l-2 border-[#2B2929]/10 ml-8 pl-8 sticky top-24 h-[calc(100vh-6rem)] overflow-hidden">
            {/* Mask Gradient Top/Bottom */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#F7F5F2] to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#F7F5F2] to-transparent z-10" />

            <motion.div
                className="flex flex-col gap-10 items-center py-4"
                animate={{ y: ["0%", "-33.33%"] }}
                transition={{
                    duration: 30, // Adjust speed: higher = slower
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {icons.map((Icon, index) => (
                    <div
                        key={index}
                        className="text-[#2B2929] opacity-30 hover:opacity-100 transition-opacity duration-300"
                    >
                        {/* Smaller Icons (w-6 h-6 = 24px) */}
                        <Icon strokeWidth={2} className="w-6 h-6" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

const BlogListPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('blogs')
                .select(`
          *,
          author:users!blogs_author_id_fkey(display_name, email)
        `)
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            if (error) throw error;
            setBlogs(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredBlogs = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#F7F5F2] font-sans text-[#2B2929] p-4 sm:p-8 lg:p-12 selection:bg-[#FFC845]">
            <div className="max-w-[1600px] mx-auto relative flex">

                {/* Background Pattern */}
                <FrameworkNodes />

                {/* Main Content Column */}
                <div className="flex-1 min-w-0">
                    {/* Navbar / Header area (Match Dashboard) */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b-2 border-[#2B2929] pb-6 relative z-10">
                        <div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2 text-[#2B2929]">
                                BLOGS
                            </h1>
                            <p className="text-xl md:text-2xl font-medium text-[#2B2929]/70">
                                Insights from the CodeSapiens universe
                            </p>
                        </div>

                        {/* Search Bar - Integrated into Header */}
                        <div className="relative w-full md:w-96 mt-6 md:mt-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2B2929]/50 w-5 h-5 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/50 border-2 border-transparent focus:border-[#2B2929] outline-none transition-all placeholder:text-[#2B2929]/40 font-bold text-[#2B2929] shadow-sm hover:bg-white"
                            />
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="relative z-10 min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <Loader2 className="w-16 h-16 animate-spin text-[#2B2929]" />
                                <p className="font-bold text-xl opacity-50">LOADING STORIES...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-32 bg-red-50 rounded-3xl border-4 border-red-100 border-dashed">
                                <p className="text-red-900 mb-6 text-2xl font-black uppercase">Failed to load content</p>
                                <p className="text-red-600 mb-8 font-medium">{error}</p>
                                <button
                                    onClick={fetchBlogs}
                                    className="px-8 py-4 bg-[#2B2929] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:-translate-y-1"
                                >
                                    RETRY
                                </button>
                            </div>
                        ) : filteredBlogs.length === 0 ? (
                            <div className="bg-white/50 text-center py-32 rounded-[2rem] border-4 border-dashed border-[#2B2929]/10">
                                <div className="w-24 h-24 bg-[#2B2929]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-10 h-10 text-[#2B2929]/40" />
                                </div>
                                <h3 className="text-3xl font-black text-[#2B2929] mb-2 uppercase tracking-tight">
                                    {blogs.length === 0 ? 'No stories yet' : 'No matches found'}
                                </h3>
                                <p className="text-[#2B2929]/60 max-w-md mx-auto font-medium text-lg">
                                    {blogs.length === 0
                                        ? 'We are crafting new content. Check back soon!'
                                        : `We couldn't find any articles matching "${searchTerm}".`}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {filteredBlogs.map((blog) => (
                                    <BlogCard key={blog.id} blog={blog} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Vertical Icon Strip */}
                <IconSidebar />
            </div>
        </div>
    );
};

export default BlogListPage;
