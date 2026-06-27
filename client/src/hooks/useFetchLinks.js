import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFetchLinks = (url) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);
    
    axios.get(url)
      .then(res => {
        if (isMounted) {
          setLinks(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return { links, loading, error };
};
