import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { 
  BarElement, 
  CategoryScale, 
  Chart as ChartJS, 
  Legend, 
  LinearScale, 
  Title, 
  Tooltip 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  Calendar, 
  Sparkles, 
  Share2, 
  ArrowLeft,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../App.css';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsView() {
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);

  // Selector filters
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [yearType, setYearType] = useState<'calendar' | 'financial'>('calendar');
  const [year, setYear] = useState(() => new Date().getFullYear());

  const monthStr = new Date().toISOString().substring(0, 7); // e.g. "2026-06"

  // 1. Fetch current month's budget details (for the narrative summary)
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', activeHouseholdId, monthStr],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/budgets/${monthStr}`),
    enabled: !!activeHouseholdId,
  });

  // 2. Fetch aggregations trend data
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ['trends', activeHouseholdId, timeframe, yearType, year],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/budgets/aggregations/trends?timeframe=${timeframe}&yearType=${yearType}&year=${year}`),
    enabled: !!activeHouseholdId,
  });

  // Calculate narrative details
  const totalSpent = budgetData?.lines?.reduce((sum: number, l: any) => sum + Number(l.actualSpent), 0) || 0;
  const totalBudgeted = budgetData?.lines?.reduce((sum: number, l: any) => sum + Number(l.plannedAmount), 0) || 0;
  const targetIncome = budgetData?.totalIncomeBudget || 0;
  const categories = budgetData?.lines || [];

  // Sort categories by spent to find the highest
  const sortedCategories = [...categories].sort((a, b) => b.actualSpent - a.actualSpent);
  const highestCategory = sortedCategories[0];
  const netSavings = targetIncome - totalSpent;

  // Render narrative text dynamically
  const generateNarrative = () => {
    if (totalBudgeted === 0 && totalSpent === 0) {
      return "Start logging transactions and planning budgets to generate your monthly review story.";
    }

    const name = budgetData?.householdName || "Your household";
    const percentSpent = totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(0) : '0';
    
    let story = `This month, you spent ₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} against a planned budget of ₹${totalBudgeted.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${percentSpent}% utilized).`;

    if (totalSpent > totalBudgeted) {
      story += ` You went over budget by ₹${(totalSpent - totalBudgeted).toLocaleString('en-IN', { maximumFractionDigits: 0 })}. `;
    } else {
      story += ` Great job staying under budget! You saved ₹${(totalBudgeted - totalSpent).toLocaleString('en-IN', { maximumFractionDigits: 0 })} of your allocated money. `;
    }

    if (highestCategory && highestCategory.actualSpent > 0) {
      story += `Your largest spending category was "${highestCategory.category.name}" at ₹${highestCategory.actualSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}. `;
      if (highestCategory.actualSpent > highestCategory.plannedAmount && highestCategory.plannedAmount > 0) {
        story += `This exceeded your category limit by ₹${(highestCategory.actualSpent - highestCategory.plannedAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}. `;
      }
    }

    // Add actionable savings advice
    if (netSavings > 0) {
      story += `You have an actual net cash savings of ₹${netSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}. We recommend routing 50% of this into your active Savings Goals.`;
    } else if (netSavings < 0) {
      story += `Your expenses exceeded target income by ₹${Math.abs(netSavings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}. Check your recurring subscriptions and discretionary Swiggy/Zomato expenditures to restore balance next month.`;
    }

    return story;
  };

  // Web Share API trigger
  const handleShare = async () => {
    const reportText = `RupeeWise Monthly Report (${monthStr}):\n\n${generateNarrative()}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RupeeWise Monthly Review',
          text: reportText,
        });
      } catch (err) {
        console.warn('Web Share failed', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(reportText);
      alert('Report copied to clipboard!');
    }
  };

  // Chart configuration
  const chartLabels = trendData.map((d: any) => d.period);
  const chartIncome = trendData.map((d: any) => d.income);
  const chartExpense = trendData.map((d: any) => d.expense);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Income',
        data: chartIncome,
        backgroundColor: 'rgba(52, 211, 153, 0.85)', // Emerald
        borderRadius: 4,
      },
      {
        label: 'Expense',
        data: chartExpense,
        backgroundColor: 'rgba(239, 68, 68, 0.85)', // Red/Danger
        borderRadius: 4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: { family: 'Inter' }
        }
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  if (budgetLoading || trendLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Reports...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <Link to="/" style={{ minHeight: 'auto', padding: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Monthly Review</h2>
          <p style={{ fontSize: '0.8rem' }}>Automated narratives & cash flow trends.</p>
        </div>
      </div>

      {/* 1. Narrative Section */}
      <div className="card card-glass" style={{
        background: 'linear-gradient(135deg, var(--card-bg), var(--bg-secondary))',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            letterSpacing: '0.05em'
          }}>
            <Sparkles size={14} /> AI Narrative Story
          </span>
          
          <button 
            style={{ minHeight: 'auto', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={handleShare}
            title="Share report"
          >
            <Share2 size={16} color="var(--text-muted)" />
          </button>
        </div>

        <p style={{ 
          fontSize: '0.95rem', 
          lineHeight: '1.6', 
          color: 'var(--text-primary)',
          fontWeight: '500'
        }}>
          {generateNarrative()}
        </p>

        {/* Narrative Highlights Grid */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--card-border)', paddingTop: 'var(--spacing-md)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Coins size={16} color="var(--primary)" />
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Net Cash Savings</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: netSavings >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ₹{netSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Percent size={16} color="var(--secondary)" />
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Largest Outgo</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                {highestCategory?.category?.name || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Charts Trend Visuals */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Cash Flow Comparison</h3>
          
          {/* Timeframe switch tabs */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '2px', borderRadius: '6px' }}>
            {(['weekly', 'monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                style={{
                  minHeight: 'auto',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: timeframe === t ? 'var(--card-bg)' : 'transparent',
                  color: timeframe === t ? 'var(--primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setTimeframe(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregation Filter settings */}
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
          <select 
            value={yearType} 
            onChange={(e: any) => setYearType(e.target.value)} 
            style={{ flex: 1, padding: '4px 6px', fontSize: '0.75rem', minHeight: '30px' }}
          >
            <option value="calendar">Calendar Year</option>
            <option value="financial">Financial Year (India)</option>
          </select>
          
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))} 
            style={{ width: '80px', padding: '4px 6px', fontSize: '0.75rem', minHeight: '30px' }}
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
          </select>
        </div>

        {/* Chart Canvas */}
        {trendData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
            No aggregation data available.
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
