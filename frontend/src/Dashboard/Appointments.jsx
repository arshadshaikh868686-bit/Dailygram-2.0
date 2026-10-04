import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getError } from '../lib/api';
import { getUser } from '../lib/auth';
import { Spinner, Empty, Toast } from '../components/UI';

const isRated = (a) =>
  a?.rating !== null && a?.rating !== undefined && Number(a.rating) > 0;

export default function Appointments() {
  const user = getUser();
  const navigate = useNavigate();
  const isMentor = user?.role === 'mentor';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [payingId, setPayingId] = useState('');
  const [completingId, setCompletingId] = useState('');
  const [confirmCompleteAppointment, setConfirmCompleteAppointment] = useState(null);
  const [ratingAppointment, setRatingAppointment] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const prevStatusRef = useRef(new Map());
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        let list = [];
        if (isMentor) {
          const [requestsRes, appointmentsRes] = await Promise.all([
            api.get('/appointments/my-requests'),
            api.get('/appointments/my-appointments'),
          ]);
          const pendingRequests = Array.isArray(requestsRes.data)
            ? requestsRes.data
            : [];
          const allAppointments = Array.isArray(appointmentsRes.data)
            ? appointmentsRes.data
            : [];
          const appointmentMap = new Map();
          [...pendingRequests, ...allAppointments].forEach((appointment) => {
            appointmentMap.set(appointment._id, appointment);
          });
          list = [...appointmentMap.values()];
        } else {
          const { data } = await api.get('/appointments/my-appointments');
          list = Array.isArray(data) ? data : [];
        }
        if (!isMentor) {
          const justCompleted = list.find((a) => {
            const prev = prevStatusRef.current.get(a._id);
            return (
              prev !== undefined &&
              prev !== 'completed' &&
              a.status === 'completed' &&
              !isRated(a)
            );
          });
          if (justCompleted) {
            setRatingAppointment((prev) => prev || justCompleted);
            setMsg('Mentor marked the session completed. Please rate your mentor.');
          }
        }
        prevStatusRef.current = new Map(list.map((a) => [a._id, a.status]));
        setItems(list);
      } catch (e) {
        if (!silent) setMsg(getError(e));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isMentor]
  );
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [load]);
  const respond = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/respond`, { status });
      await load(true);
      setMsg(
        status === 'accepted' ? 'Request accepted.' : 'Request rejected.'
      );
    } catch (e) {
      setMsg(getError(e));
    }
  };
  const completeAppointment = async (appointment) => {
    if (completingId) return;
    try {
      setCompletingId(appointment._id);
      setMsg('');
      await api.put(`/appointments/${appointment._id}/complete`);
      setItems((prev) =>
        prev.map((item) =>
          item._id === appointment._id
            ? { ...item, status: 'completed' }
            : item
        )
      );
      prevStatusRef.current.set(appointment._id, 'completed');
      setConfirmCompleteAppointment(null);
      setMsg(
        'Session marked as completed. The learner can now submit a rating.'
      );
    } catch (e) {
      setMsg(getError(e));
    } finally {
      setCompletingId('');
    }
  };
  const openChat = (appointmentId) => {
    navigate(`/dashboard/messages?appointmentId=${appointmentId}`);
  };
  const openVideoCall = (appointment) => {
    const room = appointment.room || `dailygram-${appointment._id}`;
    const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(room)}`;
    window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
  };
  const openRating = (appointment) => {
    setRatingAppointment(appointment);
    setRatingValue(isRated(appointment) ? Number(appointment.rating) : 0);
    setReview(appointment.review || '');
    setMsg('');
  };
  const closeRating = () => {
    if (ratingSubmitting) return;
    setRatingAppointment(null);
    setRatingValue(0);
    setReview('');
  };
  const submitRating = async () => {
    if (!ratingAppointment) return;
    if (isRated(ratingAppointment)) {
      setMsg('This appointment has already been rated.');
      return;
    }
    if (
      !Number.isInteger(ratingValue) ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      setMsg('Please select a rating from 1 to 5 stars.');
      return;
    }
    if (review.trim().length > 500) {
      setMsg('Review cannot be longer than 500 characters.');
      return;
    }
    try {
      setRatingSubmitting(true);
      setMsg('');
      await api.post(`/rating/${ratingAppointment._id}`, {
        rating: ratingValue,
        review: review.trim(),
      });
      setItems((prev) =>
        prev.map((item) =>
          item._id === ratingAppointment._id
            ? { ...item, rating: ratingValue, review: review.trim() }
            : item
        )
      );
      setRatingAppointment(null);
      setRatingValue(0);
      setReview('');
      setMsg('Rating submitted successfully. Thank you!');
    } catch (e) {
      setMsg(getError(e));
    } finally {
      setRatingSubmitting(false);
    }
  };
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), {
          once: true,
        });
        existingScript.addEventListener('error', () => resolve(false), {
          once: true,
        });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const payForAppointment = async (appointment) => {
    if (payingId) return;
    try {
      setPayingId(appointment._id);
      setMsg('');
      const loaded = await loadRazorpay();
      if (!loaded) {
        setMsg('Payment system could not be loaded. Please try again.');
        setPayingId('');
        return;
      }
      const { data } = await api.post('/payments/mentorship/order', {
        appointmentId: appointment._id,
      });
      if (!data?.keyId || !data?.order?.id || !data?.order?.amount) {
        throw new Error('Invalid payment order received from server.');
      }
      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'Dailygram',
        description: `Mentorship - ${appointment.skill}`,
        order_id: data.order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setPayingId('');
            setMsg('Payment cancelled.');
          },
        },
        handler: async (response) => {
          try {
            await api.post('/payments/mentorship/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMsg(
              'Payment successful! Chat and video call are now unlocked.'
            );
            await load(true);
          } catch (error) {
            setMsg(getError(error));
          } finally {
            setPayingId('');
          }
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setMsg(
          response.error?.description || 'Payment failed. Please try again.'
        );
        setPayingId('');
      });
      razorpay.open();
    } catch (error) {
      setMsg(getError(error));
      setPayingId('');
    }
  };
  const renderStars = (value, clickable = false, disabled = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!clickable || disabled || ratingSubmitting}
            onClick={() => {
              if (clickable && !disabled) {
                setRatingValue(star);
              }
            }}
            className={`text-2xl leading-none transition-transform ${
              clickable && !disabled
                ? 'cursor-pointer hover:scale-110'
                : 'cursor-default'
            } ${star <= value ? 'text-amber-400' : 'text-slate-300'}`}
            aria-label={`${star} star`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };
  const visibleItems = items.filter(
    (a) => !(a.status === 'completed' && isRated(a))
  );
  const renderBodyContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3 justify-center text-slate-500 py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Spinner />
          <span className="text-sm font-medium">Loading appointments…</span>
        </div>
      );
    }
    if (!visibleItems.length) {
      return (
        <Empty
          icon="📭"
          title={isMentor ? 'No pending requests' : 'No appointments yet'}
          text={
            isMentor
              ? 'New learner requests will appear here.'
              : 'Accepted appointments will appear here.'
          }
        />
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleItems.map((appointment) => {
          const otherPerson = isMentor
            ? appointment.learnerId
            : appointment.mentorId;
          const personName = otherPerson?.name || 'User';
          const personEmail = otherPerson?.email || '';
          const firstInitial = personName.charAt(0).toUpperCase();
          const isPending = appointment.status === 'pending';
          const isAccepted = appointment.status === 'accepted';
          const isCompleted = appointment.status === 'completed';
          const price = Number(appointment.mentorshipPrice || 0);
          const isPaid = appointment.paymentStatus === 'paid';
          const isFree = price <= 0;
          const isPaymentPending = !isFree && !isPaid;
          const isPaying = payingId === appointment._id;
          const isCompleting = completingId === appointment._id;
          const hasRating = isRated(appointment);
          return (
            <article
              key={appointment._id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  aria-hidden="true"
                >
                  {firstInitial}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                    {personName}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {personEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-y border-dashed border-slate-200/80 py-2.5 text-xs">
                <span className="text-slate-500">
                  Skill:{' '}
                  <strong className="text-slate-900 font-semibold">
                    {appointment.skill}
                  </strong>
                </span>
                <span className="text-slate-500 flex items-center gap-1.5">
                  Status:{' '}
                  <strong
                    className={`
                      px-2 py-0.5 rounded text-[10px]
                      font-bold uppercase tracking-wider
                      ${
                        isPending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : isAccepted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : isCompleted
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-red-50 text-red-700 border border-red-200/60'
                      }
                    `}
                  >
                    {appointment.status}
                  </strong>
                </span>
              </div>
              {isPending && isMentor && (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(appointment._id, 'accepted')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(appointment._id, 'rejected')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
              {(isAccepted || isCompleted) && (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mentorship fee</span>
                      <strong className="text-slate-900">₹{price}</strong>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-500">Payment</span>
                      <strong
                        className={
                          isPaid
                            ? 'text-emerald-600'
                            : isFree
                              ? 'text-slate-600'
                              : 'text-amber-600'
                        }
                      >
                        {isFree ? 'Not required' : isPaid ? 'Paid' : 'Pending'}
                      </strong>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2">
                    <span>Room:</span>
                    <code className="font-mono font-bold text-indigo-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded truncate">
                      {appointment.room || `dailygram-${appointment._id}`}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openChat(appointment._id)}
                      disabled={!isFree && !isPaid}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-xs"
                    >
                      💬 Message
                    </button>
                    <button
                      onClick={() => openVideoCall(appointment)}
                      disabled={!isFree && !isPaid}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-xs"
                    >
                      📹 Video Call
                    </button>
                  </div>
                  {isMentor && isAccepted && (
                    <button
                      type="button"
                      onClick={() => setConfirmCompleteAppointment(appointment)}
                      disabled={isCompleting || (!isFree && !isPaid)}
                      className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
                    >
                      {isCompleting
                        ? 'Completing session...'
                        : !isFree && !isPaid
                          ? 'Complete after payment'
                          : '✅ Mark Session Completed'}
                    </button>
                  )}
                  {isMentor && isCompleted && (
                    <p className="text-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg py-2">
                      Waiting for the learner&apos;s rating…
                    </p>
                  )}
                  {!isMentor && isAccepted && isPaymentPending && (
                    <button
                      disabled={isPaying}
                      onClick={() => payForAppointment(appointment)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm transition-colors"
                    >
                      {isPaying ? 'Opening payment...' : `💳 Pay ₹${price}`}
                    </button>
                  )}
                  {!isMentor && isCompleted && (
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {hasRating ? 'Your rating' : 'Rate your mentor'}
                          </p>
                          {hasRating && (
                            <div className="mt-1 flex items-center gap-2">
                              {renderStars(Number(appointment.rating))}
                              <span className="text-xs font-bold text-slate-700">
                                {appointment.rating}/5
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openRating(appointment)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors"
                        >
                          {hasRating ? 'View Rating' : '⭐ Rate'}
                        </button>
                      </div>
                      {hasRating && appointment.review && (
                        <p className="mt-2 text-xs text-slate-600 italic">
                          “{appointment.review}”
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };
  const ratingAlreadySubmitted = ratingAppointment && isRated(ratingAppointment);
  return (
    <div className="space-y-8">
      <header>
        <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase block mb-1">
          APPOINTMENTS
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {isMentor ? 'Incoming requests' : 'Your sessions'}
        </h1>
        <p className="text-slate-500 mt-1 text-sm leading-relaxed">
          {isMentor
            ? 'Accept requests, conduct sessions and mark them completed.'
            : 'Manage your mentorship sessions and rate completed sessions.'}
        </p>
      </header>
      <main className="w-full">{renderBodyContent()}</main>
      {confirmCompleteAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Complete Session
                  </p>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    Mark appointment as completed?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmCompleteAppointment(null)}
                  disabled={!!completingId}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Are you sure you want to mark this session as completed?
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  The learner will be asked to rate this session. Once the
                  learner submits the rating, the appointment will be removed
                  from both your lists.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmCompleteAppointment(null)}
                  disabled={!!completingId}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => completeAppointment(confirmCompleteAppointment)}
                  disabled={!!completingId}
                  className="flex-1 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm"
                >
                  {completingId ? 'Completing...' : 'Yes, Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {ratingAppointment && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !ratingSubmitting) {
              closeRating();
            }
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Mentor Feedback
                  </p>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {ratingAlreadySubmitted
                      ? 'Your Mentor Rating'
                      : `Rate ${ratingAppointment.mentorId?.name || 'your mentor'}`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeRating}
                  disabled={ratingSubmitting}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-3">
                  {ratingAlreadySubmitted
                    ? 'Your submitted rating'
                    : 'How was your mentorship session?'}
                </p>
                <div className="flex justify-center">
                  {renderStars(
                    ratingValue,
                    !ratingAlreadySubmitted,
                    ratingAlreadySubmitted
                  )}
                </div>
                {ratingValue > 0 && (
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {ratingValue === 5
                      ? 'Excellent'
                      : ratingValue === 4
                        ? 'Very good'
                        : ratingValue === 3
                          ? 'Good'
                          : ratingValue === 2
                            ? 'Needs improvement'
                            : 'Poor'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Review <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  disabled={ratingAlreadySubmitted}
                  maxLength={500}
                  rows={4}
                  placeholder="Share your experience with this mentor..."
                  className="w-full resize-none border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {review.length}/500
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeRating}
                  disabled={ratingSubmitting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold py-2.5 rounded-xl text-sm"
                >
                  {ratingAlreadySubmitted ? 'Close' : 'Cancel'}
                </button>
                {!ratingAlreadySubmitted && (
                  <button
                    type="button"
                    onClick={submitRating}
                    disabled={ratingSubmitting || ratingValue < 1}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm"
                  >
                    {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Toast
        message={msg}
        type={
          msg.includes('accepted') ||
          msg.includes('rejected') ||
          msg.includes('successful') ||
          msg.includes('completed') ||
          msg.includes('Rating submitted')
            ? 'success'
            : 'error'
        }
        onClose={() => setMsg('')}
      />
    </div>
  );
}