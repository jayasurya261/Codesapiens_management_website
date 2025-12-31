import React from 'react';
import { Clock, Calendar, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BlogCard = ({ blog, variant = 'default' }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getReadTime = (content) => {
        if (!content) return '1 min';
        const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min`;
    };

    const getExcerpt = (content, maxLength = 120) => {
        if (blog.excerpt) return blog.excerpt;
        const text = content?.replace(/<[^>]*>/g, '') || '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // --- FEATURED CARD (Large) ---
    if (variant === 'featured') {
        return (
            <motion.article
                onClick={() => navigate(`/blog/${blog.slug}`)}
                className="group relative bg-white rounded-[2rem] shadow-lg overflow-hidden cursor-pointer"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
            >
                <div className="grid md:grid-cols-2 gap-0 h-full">
                    {/* Image */}
                    <div className="relative h-64 md:h-full overflow-hidden">
                        {blog.cover_image ? (
                            <img
                                src={blog.cover_image}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                                <span className="text-white text-8xl font-black opacity-20">
                                    {blog.title?.charAt(0) || 'B'}
                                </span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-8 lg:p-10 flex flex-col justify-center bg-white">
                        <span className="inline-block px-3 py-1 bg-[#2B2929] text-white text-xs font-bold uppercase tracking-wider rounded-lg mb-6 w-fit">
                            Featured Story
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#2B2929] mb-4 group-hover:text-[#0061FE] transition-colors leading-tight">
                            {blog.title}
                        </h2>
                        <p className="text-[#2B2929]/70 mb-6 line-clamp-3 text-lg font-medium leading-relaxed">
                            {getExcerpt(blog.content, 200)}
                        </p>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                                <span>{getReadTime(blog.content)} READ</span>
                                <span>•</span>
                                <span>{formatDate(blog.published_at)}</span>
                            </div>
                            <div className="w-12 h-12 bg-[#F7F5F2] rounded-full flex items-center justify-center group-hover:bg-[#0061FE] group-hover:text-white transition-all">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.article>
        );
    }

    // --- COMPACT ROW (Sidebar/List) ---
    if (variant === 'compact') {
        return (
            <motion.article
                onClick={() => navigate(`/blog/${blog.slug}`)}
                className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 cursor-pointer"
                whileHover={{ x: 5 }}
            >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {blog.cover_image && (
                        <img
                            src={blog.cover_image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2B2929] group-hover:text-[#0061FE] transition-colors line-clamp-2 mb-1">
                        {blog.title}
                    </h3>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {formatDate(blog.published_at)}
                    </div>
                </div>
            </motion.article>
        );
    }

    // --- DEFAULT BENTO CARD (Grid) ---
    return (
        <motion.article
            onClick={() => navigate(`/blog/${blog.slug}`)}
            className="group relative bg-white rounded-[2rem] overflow-hidden shadow-lg cursor-pointer flex flex-col h-full border border-transparent hover:border-gray-100"
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Image Area */}
            <div className="relative h-56 overflow-hidden">
                {blog.cover_image ? (
                    <img
                        src={blog.cover_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-[#2B2929] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--brand-cream)_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
                        <span className="text-white text-6xl font-black opacity-20 z-10">
                            {blog.title?.charAt(0) || 'B'}
                        </span>
                    </div>
                )}

                {/* Read Time Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider text-[#2B2929] shadow-sm">
                    {getReadTime(blog.content)}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 md:p-8 flex flex-col flex-1">
                <div className="mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-[#2B2929] mb-3 group-hover:text-[#0061FE] transition-colors leading-tight line-clamp-2">
                        {blog.title}
                    </h3>
                    <p className="text-[#2B2929]/60 text-base font-medium line-clamp-3 leading-relaxed">
                        {getExcerpt(blog.content)}
                    </p>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Author Avatar Placeholder or Date */}
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                            {blog.author?.display_name?.charAt(0) || <User className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#2B2929]">{blog.author?.display_name || 'CodeSapiens'}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{formatDate(blog.published_at)}</span>
                        </div>
                    </div>

                    <div className="w-10 h-10 rounded-full border-2 border-[#2B2929]/10 flex items-center justify-center group-hover:bg-[#2B2929] group-hover:border-[#2B2929] transition-all">
                        <ChevronRight className="w-5 h-5 text-[#2B2929] group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

export default BlogCard;
