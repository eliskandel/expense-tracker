import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Header from '../components/Header';
import { ThemeContext } from '../context/ThemeContext';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Data is now inside the component to avoid import errors
const learnContent = {
    blogs: [
        {
            id: '1',
            title: '5 Habits for a Healthier Financial Life',
            summary: 'Learn simple daily habits that can significantly improve your financial well-being over time.',
            icon: 'wallet',
            link: 'https://example.com/blog/1'
        },
        {
            id: '2',
            title: 'The Power of Compound Interest',
            summary: 'Explore how compound interest can make your money work for you, and why starting early is key.',
            icon: 'chart-line',
            link: 'https://example.com/blog/2'
        },
        {
            id: '3',
            title: 'Understanding a Zero-Based Budget',
            summary: 'Discover how assigning every rupee a job can give you complete control over your spending.',
            icon: 'bank',
            link: 'https://example.com/blog/3'
        },
    ],
    videos: [
        {
            id: '1',
            title: 'Budgeting 101 for Beginners',
            icon: 'youtube-tv',
            link: 'https://www.youtube.com/watch?v=video_id_1'
        },
        {
            id: '2',
            title: 'Saving Money with the 50/30/20 Rule',
            icon: 'youtube-tv',
            link: 'https://www.youtube.com/watch?v=video_id_2'
        },
        {
            id: '3',
            title: 'Financial Planning for Your 20s',
            icon: 'youtube-tv',
            link: 'https://www.youtube.com/watch?v=video_id_3'
        },
    ],
    faqs: [
        {
            id: '1',
            question: 'What is a budget?',
            answer: 'A budget is a plan for how you’ll spend your money. It helps you track your income and expenses to ensure you have enough money for your goals.',
        },
        {
            id: '2',
            question: 'How much should I save from my salary?',
            answer: 'A common rule of thumb is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment. This can be adjusted based on your personal situation.',
        },
    ],
};

const LearnScreen = () => {
    const { colors, isDarkMode } = useContext(ThemeContext);
    const [expandedFAQ, setExpandedFAQ] = useState(null);

    const toggleFAQ = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const handlePressLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const containerStyle = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    const cardBgColor = isDarkMode ? 'bg-gray-700' : 'bg-white';
    const textStyle = isDarkMode ? 'text-white' : 'text-gray-900';
    const subtextStyle = isDarkMode ? 'text-gray-400' : 'text-gray-600';

    return (
        <ScrollView className={`flex-1 ${containerStyle}`}>
            <Header title="Financial Literacy" showBackButton={false} />
            <View className="p-6">
                {/* Financial Blogs Section */}
                <Text className={`text-xl font-bold ${textStyle} mb-4`}>Financial Health Blogs</Text>
                {learnContent.blogs.map(blog => (
                    <TouchableOpacity
                        key={blog.id}
                        className={`${cardBgColor} p-4 rounded-xl mb-4 shadow-sm flex-row items-center`}
                        onPress={() => handlePressLink(blog.link)}
                    >
                        <MaterialCommunityIcons name={blog.icon} size={32} color={colors.primary} />
                        <View className="ml-4 flex-1">
                            <Text className={`text-lg font-semibold ${textStyle}`}>{blog.title}</Text>
                            <Text className={`text-sm ${subtextStyle}`}>{blog.summary}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Videos Section */}
                <View className="h-6" />
                <Text className={`text-xl font-bold ${textStyle} mb-4`}>Videos to Watch</Text>
                {learnContent.videos.map(video => (
                    <TouchableOpacity
                        key={video.id}
                        className={`${cardBgColor} p-4 rounded-xl mb-4 shadow-sm flex-row items-center`}
                        onPress={() => handlePressLink(video.link)}
                    >
                        <MaterialCommunityIcons name={video.icon} size={32} color="#FF0000" />
                        <View className="ml-4 flex-1">
                            <Text className={`text-lg font-semibold ${textStyle}`}>{video.title}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* FAQ Section */}
                <View className="h-6" />
                <Text className={`text-xl font-bold ${textStyle} mb-4`}>FAQs about Finance</Text>
                {learnContent.faqs.map(faq => (
                    <View key={faq.id} className={`${cardBgColor} p-4 rounded-xl mb-4 shadow-sm`}>
                        <TouchableOpacity
                            onPress={() => toggleFAQ(faq.id)}
                            className="flex-row justify-between items-center"
                        >
                            <Text className={`text-lg font-semibold flex-1 ${textStyle}`}>
                                {faq.question}
                            </Text>
                            <MaterialCommunityIcons
                                name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={colors.subtext}
                            />
                        </TouchableOpacity>
                        {expandedFAQ === faq.id && (
                            <Text className={`mt-2 ${subtextStyle}`}>
                                {faq.answer}
                            </Text>
                        )}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

export default LearnScreen;