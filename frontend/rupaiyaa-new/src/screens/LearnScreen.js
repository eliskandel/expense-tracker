import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, Text, TouchableOpacity, UIManager, View } from 'react-native';
import CustomHeader from '../components/CustomHeader';
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
            title: '12 Habits to Help You Reach Financial Freedom',
            summary: 'Learn key habits like budgeting, debt reduction, automatic savings, and financial education to improve your financial health.',
            icon: 'wallet',
            link: 'https://www.investopedia.com/articles/personal-finance/112015/these-10-habits-will-help-you-reach-financial-freedom.asp'
        },
        {
            id: '2',
            title: 'The Power of Compound Interest: Calculations and Examples',
            summary: 'Explore how compound interest grows your money faster than simple interest and why more compounding periods help.',
            icon: 'chart-line',
            link: 'https://www.investopedia.com/terms/c/compoundinterest.asp'
        },
        {
            id: '3',
            title: 'What Is Financial Health and How to Improve It',
            summary: 'Understand financial health, how to measure it, and actionable steps like budgeting, net worth assessment, and building an emergency fund.',
            icon: 'bank',
            link: 'https://www.investopedia.com/terms/f/financial-health.asp'
        },
        {
            id: '4',
            title: 'Reduce Stress With These 2 Simple Money Habits Backed by Experts',
            summary: 'Learn how habits like saving regularly and paying debts on time can boost your mental health and overall productivity.',
            icon: 'heart',  // symbolizes well-being & mental health
            link: 'https://www.investopedia.com/reduce-stress-with-these-2-simple-money-habits-backed-by-experts-11794598'
        },
        {
            id: '5',
            title: 'The Rule of 72: What It Is and How to Use It',
            summary: 'Quickly estimate how long your money will double (or inflation will halve its value) using this handy rule of thumb.',
            icon: 'clock',  // time-based calculation
            link: 'https://www.investopedia.com/ask/answers/what-is-the-rule-72/'
        },
        {
            id: '6',
            title: 'Is Financial Mindfulness the Key to Unlocking Your Financial Goals?',
            summary: 'Discover how applying mindfulness techniques to money decisions can help you make better choices and improve outcomes.',
            icon: 'brain',  // represents mindfulness
            link: 'https://www.investopedia.com/financial-mindfulness-8779210'
        },
        {
            id: '7',
            title: 'How Investing Just $100 a Month Could Transform Your Wealth in 30 Years',
            summary: 'See how consistent, small investments can grow significantly through the power of compound interest over the long run.',
            icon: 'trending-up',  // growth / investing
            link: 'https://www.investopedia.com/articles/investing/100615/investing-100-month-stocks-30-years.asp'
        }
        ,
        {
            id: '8',
            title: 'Why Save for Retirement in Your 20s?',
            summary: 'Learn why starting early makes a huge difference: compound interest means your money can work harder over time.',
            icon: 'credit-card',
            link: 'https://www.investopedia.com/articles/personal-finance/040315/why-save-retirement-your-20s.asp'
        },
        {
            id: '9',
            title: 'Strategies for Wealth Preservation: Safeguarding Your Financial Future',
            summary: 'Combine healthy habits with tactics like diversification, insurance, tax planning, and estate preparation to protect your wealth.',
            icon: 'flag-checkered',
            link: 'https://www.investopedia.com/strategies-for-wealth-preservation-8604652'
        },
    ],
    videos: [
        {
            id: '1',
            title: 'Budgeting 101 for Beginners',
            icon: 'youtube-tv',
            link: 'https://youtu.be/ELddtcZouP0?si=cATOE1K9YQ-L_sjR'
        },
        {
            id: '2',
            title: 'Saving Money with the 50/30/20 Rule',
            icon: 'youtube-tv',
            link: 'https://youtu.be/HQzoZfc3GwQ?si=YIDnm4ALY9GeVLVT'
        },
        {
            id: '3',
            title: 'Financial Planning for Your 20s',
            icon: 'youtube-tv',
            link: 'https://youtu.be/v9Va136MHtg?si=MsvsAb5RXVGKbnot'
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
        {
            id: '3',
            question: 'Why is tracking expenses important?',
            answer: 'Tracking expenses helps you identify where your money goes, cut down on unnecessary spending, and stick to your financial goals.',
        },
        {
            id: '4',
            question: 'What is an emergency fund?',
            answer: 'An emergency fund is money set aside to cover unexpected expenses like medical bills, car repairs, or job loss. Ideally, it should cover 3–6 months of living expenses.',
        },
        {
            id: '5',
            question: 'How can I start saving if my income is low?',
            answer: 'Start small. Even saving a small percentage of your income consistently can build up over time. Automating your savings can also make it easier.',
        },
        {
            id: '6',
            question: 'What are fixed and variable expenses?',
            answer: 'Fixed expenses stay the same every month, like rent or loan payments. Variable expenses change, like groceries, utilities, or entertainment.',
        },
        {
            id: '7',
            question: 'How do I reduce unnecessary spending?',
            answer: 'Track your expenses, identify non-essential items, set spending limits, and prioritize needs over wants. Small lifestyle changes can save you a lot over time.',
        },
        {
            id: '8',
            question: 'Is it better to save or invest?',
            answer: 'Both are important. Saving ensures you have cash for emergencies and short-term goals, while investing helps grow your wealth for long-term goals like retirement.',
        },
        {
            id: '9',
            question: 'What is debt management?',
            answer: 'Debt management is creating a strategy to pay off your debts efficiently. This could include prioritizing high-interest loans or consolidating multiple debts.',
        },
        {
            id: '10',
            question: 'How do financial goals help?',
            answer: 'Setting financial goals gives you direction and motivation. Whether it’s buying a house, paying off debt, or saving for travel, goals help you stay disciplined.',
        },
    ]
    
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
            <CustomHeader 
                title="Learn & Grow"
                subtitle="Financial Literacy"
                showBackButton={false}
                showProfileIcon={true}
                isSmall={true}
            />
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